
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HRManagerData, OrganizationData, ReviewData, SupervisorData } from "./types/hrTypes";
import { fetchHRManagerData } from "./services/hrDataService";

export function useHRManagerData(): HRManagerData {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizationData, setOrganizationData] = useState<OrganizationData>({ supervisors: [] });
  const [hrManagerReview, setHRManagerReview] = useState<ReviewData | null>(null);
  const [hrManagerName, setHRManagerName] = useState<string>("");
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [supervisorFullData, setSupervisorFullData] = useState<SupervisorData | null>(null);

  const loadHRManagerData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/login');
        return;
      }

      const { 
        isAuthorized,
        organizationData: orgData, 
        hrManagerReview: review, 
        hrManagerName: name,
        supervisorId: supId,
        supervisorName: supName
      } = await fetchHRManagerData(user.id);

      if (!isAuthorized) {
        navigate('/');
        return;
      }

      console.log("HR Manager data loaded:", {
        supervisorsCount: orgData.supervisors.length,
        hrManagerName: name,
        supervisorId: supId,
        supervisorName: supName
      });

      setOrganizationData(orgData);
      setHRManagerReview(review);
      setHRManagerName(name);
      setSupervisorId(supId);
      setSupervisorName(supName);

      // Verificar específicamente si el empleado objetivo está presente
      const targetEmployeeId = "0e607fc0-833b-4cdf-8e7d-7eb057e6cf82";
      let employeeFound = false;
      
      // Buscar primero en supervisores
      for (const supervisor of orgData.supervisors) {
        if (supervisor.id === targetEmployeeId) {
          employeeFound = true;
          console.log(`El empleado ${targetEmployeeId} es un supervisor`);
          break;
        }
        
        // Buscar en empleados de cada supervisor
        const employeeExists = supervisor.employees.some(emp => emp.id === targetEmployeeId);
        if (employeeExists) {
          employeeFound = true;
          console.log(`Empleado ${targetEmployeeId} encontrado bajo el supervisor ${supervisor.id} (${supervisor.first_name} ${supervisor.last_name})`);
          break;
        }
      }
      
      if (!employeeFound) {
        console.log(`Empleado ${targetEmployeeId} NO encontrado en ningún supervisor. Verificando existencia...`);
        
        // Verificar si el empleado existe en la base de datos
        const { data: employeeProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', targetEmployeeId)
          .single();
          
        if (profileError) {
          console.error(`Error al verificar perfil de empleado ${targetEmployeeId}:`, profileError);
        } else if (employeeProfile) {
          console.log(`Perfil de empleado encontrado: ${employeeProfile.first_name} ${employeeProfile.last_name}`);
          
          // Crear relación supervisor-empleado si no existe
          const { data: existingRelation, error: relationError } = await supabase
            .from('supervisor_employees')
            .select('*')
            .eq('employee_id', targetEmployeeId)
            .eq('supervisor_id', user.id)
            .maybeSingle();
            
          if (relationError) {
            console.error('Error al verificar relación existente:', relationError);
          } else if (!existingRelation) {
            console.log(`Creando relación entre supervisor ${user.id} y empleado ${targetEmployeeId}`);
            
            const { error: insertError } = await supabase
              .from('supervisor_employees')
              .insert({
                supervisor_id: user.id,
                employee_id: targetEmployeeId
              });
              
            if (insertError) {
              console.error('Error al crear relación supervisor-empleado:', insertError);
            } else {
              console.log(`Relación creada exitosamente`);
              // Recargar datos después de crear la relación
              return loadHRManagerData();
            }
          } else {
            console.log(`Ya existe una relación entre supervisor ${user.id} y empleado ${targetEmployeeId}`);
          }
        } else {
          console.log(`No se encontró el perfil del empleado ${targetEmployeeId}`);
        }
      }

      // Si hay un supervisor asignado, obtener sus datos completos
      if (supId) {
        try {
          // Improved supervisor data loading to avoid ambiguous relation error
          const { data: supervisorData, error: supervisorError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', supId)
            .single();

          if (supervisorError) throw supervisorError;

          // Get the supervisor's position from their latest review
          const { data: supervisorReview, error: reviewError } = await supabase
            .from('performance_reviews')
            .select('id, status, current_position, department, created_at')
            .eq('employee_id', supId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (reviewError) throw reviewError;

          // Format supervisor data
          const formattedSupervisor: SupervisorData = {
            id: supervisorData.id,
            first_name: supervisorData.first_name,
            last_name: supervisorData.last_name,
            current_position: supervisorReview?.current_position || 'Supervisor',
            latest_review: supervisorReview || undefined,
            employees: [] // Not needed here
          };

          setSupervisorFullData(formattedSupervisor);
          console.log("Supervisor data loaded:", formattedSupervisor);
        } catch (error) {
          console.error('Error loading supervisor details:', error);
        }
      } else {
        // Debug information if supervisor is not found
        console.log("Estado real en la base de datos para usuario target:", user.id);
        
        // Check the supervisor-employee relationship directly
        const { data: relation, error: relationError } = await supabase
          .from('supervisor_employees')
          .select('supervisor_id')
          .eq('employee_id', user.id)
          .maybeSingle();
          
        if (relationError) {
          console.error("Error checking relation:", relationError);
        } else {
          console.log("Relación encontrada:", relation);
        }
      }
    } catch (error) {
      console.error('Error in loadHRManagerData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHRManagerData();
  }, [navigate]);

  // Función para recargar datos
  const reloadData = async () => {
    console.log("Recargando datos del HR Manager...");
    await loadHRManagerData();
    return true;
  };

  return {
    loading,
    organizationData,
    hrManagerReview,
    hrManagerName,
    supervisorId,
    supervisorName,
    supervisorFullData,
    reloadData
  };
}
