
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  status: string;
  created_at: string;
  current_position?: string;
}

export interface PendingReview {
  status: "pendiente";
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  latest_review: Review | PendingReview;
  company_name?: string;
  current_position?: string;
  supervisor_id?: string;
}

export interface SupervisorReview {
  id: string;
  status: string;
  review_date: string;
  department: string;
  current_position: string;
}

export function useSupervisorData() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [supervisorReview, setSupervisorReview] = useState<SupervisorReview | null>(null);

  useEffect(() => {
    const loadSupervisorData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("No hay usuario autenticado");
          navigate('/auth/login');
          return;
        }

        console.log("Usuario autenticado:", user.id);
        setSupervisorId(user.id);

        // Verificar rol de supervisor
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError) {
          console.error("Error al verificar rol:", roleError);
          return;
        }

        console.log("Rol del usuario:", userRole?.role);
        if (userRole?.role !== 'supervisor') {
          console.log("Usuario no es supervisor");
          navigate('/');
          return;
        }

        await Promise.all([
          loadSupervisorProfile(user.id),
          loadSupervisedEmployees(user.id),
          loadSupervisorReview(user.id)
        ]);

      } catch (error) {
        console.error('Error loading supervisor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSupervisorData();
  }, [navigate]);

  const loadSupervisorProfile = async (userId: string) => {
    const { data: supervisorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error al cargar perfil:", profileError);
      return;
    }

    if (supervisorProfile) {
      setSupervisorName(`${supervisorProfile.first_name} ${supervisorProfile.last_name}`);
      console.log("Perfil de supervisor cargado:", supervisorProfile.first_name, supervisorProfile.last_name);
    }
  };

  const loadSupervisedEmployees = async (userId: string) => {
    // Consulta a la tabla de relaciones supervisor_employees
    console.log("Consultando empleados del supervisor ID:", userId);
    
    // DEBUG: Listar todas las relaciones en la tabla para diagnosticar
    const { data: allRelations, error: allRelationsError } = await supabase
      .from('supervisor_employees')
      .select('*');
      
    if (allRelationsError) {
      console.error("Error al obtener todas las relaciones:", allRelationsError);
    } else {
      console.log("Todas las relaciones en la tabla:", allRelations);
    }
    
    const { data: supervisorRelations, error: relationsError } = await supabase
      .from('supervisor_employees')
      .select('employee_id')
      .eq('supervisor_id', userId);

    if (relationsError) {
      console.error("Error al obtener relaciones:", relationsError);
      return;
    }

    console.log("Relaciones de supervisor encontradas:", supervisorRelations?.length || 0);
    
    if (!supervisorRelations || supervisorRelations.length === 0) {
      console.log("No hay empleados asignados a este supervisor");
      setEmployees([]);
      return;
    }

    // Obtener IDs de empleados supervisados
    const employeeIds = supervisorRelations.map(rel => rel.employee_id);
    console.log("IDs de empleados a cargar:", employeeIds);
    await loadEmployeeProfiles(employeeIds);
  };
  
  const loadEmployeeProfiles = async (employeeIds: string[]) => {
    console.log("Cargando perfiles para IDs:", employeeIds);
    
    // Obtener perfiles de empleados
    const { data: employeeProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        company:companies (
          name
        )
      `)
      .in('id', employeeIds);

    if (profilesError) {
      console.error("Error al cargar perfiles:", profilesError);
      return;
    }

    console.log("Perfiles de empleados encontrados:", employeeProfiles?.length || 0);
    
    if (!employeeProfiles || employeeProfiles.length === 0) {
      console.log("No se encontraron perfiles para los empleados asignados");
      setEmployees([]);
      return;
    }

    // Para cada empleado, obtener su última revisión
    const formattedEmployees = await Promise.all(
      employeeProfiles.map(async (profile) => {
        // Obtener última revisión
        const { data: latestReview, error: reviewError } = await supabase
          .from('performance_reviews')
          .select('id, status, created_at, current_position')
          .eq('employee_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reviewError) {
          console.error(`Error al cargar revisión para ${profile.id}:`, reviewError);
        }

        // Obtener supervisor del empleado
        const { data: supervisorRelation, error: supError } = await supabase
          .from('supervisor_employees')
          .select('supervisor_id')
          .eq('employee_id', profile.id)
          .maybeSingle();

        if (supError) {
          console.error(`Error al obtener supervisor para ${profile.id}:`, supError);
        }

        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          company_name: profile.company?.name,
          current_position: latestReview?.current_position,
          supervisor_id: supervisorRelation?.supervisor_id,
          latest_review: latestReview || { status: "pendiente" }
        } as Employee;
      })
    );

    console.log("Empleados formateados final:", formattedEmployees.length);
    setEmployees(formattedEmployees);
  };

  const loadSupervisorReview = async (userId: string) => {
    const { data: supervisorLatestReview, error: supervisorReviewError } = await supabase
      .from('performance_reviews')
      .select('id, status, review_date, department, current_position')
      .eq('employee_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (supervisorReviewError) {
      console.error("Error al cargar revisión del supervisor:", supervisorReviewError);
      return;
    }

    // Si no hay revisión o está en estado inicial, establecer como pendiente
    if (!supervisorLatestReview || !supervisorLatestReview.status) {
      setSupervisorReview({
        id: supervisorLatestReview?.id || '',
        status: 'pendiente',
        review_date: new Date().toISOString(),
        department: supervisorLatestReview?.department || '',
        current_position: supervisorLatestReview?.current_position || ''
      });
    } else {
      setSupervisorReview(supervisorLatestReview);
    }
  };

  return {
    employees,
    supervisorName,
    supervisorId,
    loading,
    supervisorReview,
    loadSupervisedEmployees  // Añadimos la función al objeto retornado
  };
}
