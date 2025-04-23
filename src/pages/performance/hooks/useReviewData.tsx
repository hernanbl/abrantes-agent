import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDeadline } from "@/hooks/use-deadline";
import { createDefaultKpisIfEmpty } from "@/pages/performance/services/createDefaultKpis";

interface ReviewData {
  id?: string;
  employee_id: string;
  supervisor_id: string | null;
  department: string;
  current_position: string;
  position_start_date: string;
  review_date: string;
  status: 'pendiente' | 'borrador' | 'enviado';
  supervisor_comment?: string | null;
  employee_comment?: string | null;
  long_term_goal?: string | null;
  kpis?: any[];
  employee_name?: string;
}

export function useReviewData(employeeId?: string) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isHrManager, setIsHrManager] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const deadline = useDeadline({ 
    userId: employeeId || currentUserId || undefined,
    reviewId: reviewData?.id
  });

  const loadReviewData = async () => {
    try {
      setLoading(true);
      console.log("Iniciando carga de datos de revisión...");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/login');
        return;
      }

      setCurrentUserId(user.id);

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      console.log("Roles del usuario:", userRoles);
      
      const userRolesList = userRoles?.map(r => r.role) || [];
      const userIsHrManager = userRolesList.includes('hr_manager');
      const userIsSupervisor = userRolesList.includes('supervisor');
      
      setIsSupervisor(userIsSupervisor);
      setIsHrManager(userIsHrManager);

      const targetEmployeeId = employeeId || user.id;
      
      const isViewingOwnForm = targetEmployeeId === user.id;
      
      console.log("Checking supervisor status for employee:", targetEmployeeId, "Current user:", user.id);
      
      // Verificar si el usuario actual es supervisor del empleado objetivo
      const { data: supervisorData, error: supervisorError } = await supabase
        .from('supervisor_employees')
        .select('*')
        .eq('supervisor_id', user.id)
        .eq('employee_id', targetEmployeeId)
        .maybeSingle();
        
      const isDirectSupervisor = !!supervisorData;
      console.log("Direct supervisor check:", {isDirectSupervisor, supervisorData});
      
      // Consulta para obtener la revisión
      console.log("Buscando revisión para el empleado:", targetEmployeeId);
      const { data: reviews, error: reviewError } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('employee_id', targetEmployeeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reviewError) {
        console.error("Error fetching review:", reviewError);
        throw reviewError;
      }

      console.log("Review data from Supabase:", reviews);

      if (!reviews) {
        console.log("No se encontró revisión, creando una nueva...");
        const isOwnReview = isViewingOwnForm;
        
        if (userIsHrManager && !isOwnReview) {
          toast({
            variant: "destructive",
            title: "Acceso denegado",
            description: "No existe una evaluación para este empleado"
          });
          navigate('/hr/dashboard');
          return;
        }
        
        const newReview = {
          employee_id: targetEmployeeId,
          supervisor_id: null,
          department: '',
          current_position: '',
          position_start_date: new Date().toISOString().split('T')[0],
          review_date: new Date().toISOString().split('T')[0],
          status: 'pendiente' as const,
          long_term_goal: '',
          employee_comment: '',
          supervisor_comment: ''
        };
        
        const { data: createdReview, error: createError } = await supabase
          .from('performance_reviews')
          .insert(newReview)
          .select()
          .single();

        if (createError) {
          throw createError;
        }
        
        setReviewData({
          ...createdReview,
          status: 'pendiente',
          long_term_goal: '',
          employee_comment: '',
          supervisor_comment: '',
          kpis: [],
        });
        
        setIsReadOnly(false);
      } else {
        console.log("Revisión encontrada con ID:", reviews.id, "y estado:", reviews.status);
        
        // Obtener el nombre del empleado
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', reviews.employee_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching employee profile:', profileError);
        }
        
        const fullName = profileData 
          ? `${profileData.first_name} ${profileData.last_name}`.trim()
          : "Usuario";
            
        const isStatusSubmitted = reviews.status === 'enviado';
        
        const isOwnReview = isViewingOwnForm;
        
        // Los supervisores y HR siempre pueden ver y editar ciertas partes del formulario
        const shouldBeReadOnly = isStatusSubmitted && 
                               (!isOwnReview && !isDirectSupervisor && !userIsHrManager);
        
        setIsReadOnly(shouldBeReadOnly);
        
        console.log("Read-only calculation:", { 
          isOwnReview,
          isHrManager: userIsHrManager,
          isDirectSupervisor,
          isStatusSubmitted,
          isReadOnlyResult: shouldBeReadOnly,
          userId: user.id,
          employeeId: reviews.employee_id,
          supervisorId: reviews.supervisor_id
        });
        
        // CARGA DIRECTA DE KPIs
        console.log("Cargando KPIs para la revisión ID:", reviews.id);
        
        const { data: kpisData, error: kpisError } = await supabase
          .from('performance_kpis')
          .select('*')
          .eq('review_id', reviews.id)
          .order('created_at', { ascending: true });
          
        if (kpisError) {
          console.error("Error al cargar KPIs:", kpisError);
        }
        
        console.log("KPIs cargados:", kpisData);
        
        // Procesar los KPIs
        let formattedKpis = [];
        
        if (kpisData && kpisData.length > 0) {
          console.log("Procesando", kpisData.length, "KPIs");
          
          formattedKpis = kpisData.map(kpi => {
            // Asegurar que todos los datos estén presentes y con el tipo correcto
            const processedKpi = {
              id: kpi.id,
              description: kpi.description || '',
              deadline: kpi.deadline || new Date().toISOString().split('T')[0],
              weight: Number(kpi.weight) || 0,
              completion_percentage: kpi.completion_percentage !== null ? Number(kpi.completion_percentage) : 0,
              supervisor_rating: kpi.supervisor_rating !== null ? Number(kpi.supervisor_rating) : 0,
              created_at: kpi.created_at || new Date().toISOString(),
              review_id: kpi.review_id
            };
            
            console.log("KPI procesado:", processedKpi.id, "Rating:", processedKpi.supervisor_rating);
            return processedKpi;
          });
        } else {
          console.log("No se encontraron KPIs para esta revisión");
        }
        
        // Si no hay KPIs válidos y el usuario puede crear KPIs por defecto, intentarlo
        if ((formattedKpis.length === 0 || !formattedKpis.some(k => k.description?.trim())) && 
             (isDirectSupervisor || userIsHrManager)) {
          console.log("Intentando crear KPIs por defecto");
          const created = await createDefaultKpisIfEmpty(reviews.id);
          
          if (created) {
            console.log("KPIs por defecto creados, recargando...");
            // Volver a cargar los KPIs después de crearlos
            const { data: refreshedKpis, error: refreshError } = await supabase
              .from('performance_kpis')
              .select('*')
              .eq('review_id', reviews.id)
              .order('created_at', { ascending: true });
              
            if (!refreshError && refreshedKpis && refreshedKpis.length > 0) {
              formattedKpis = refreshedKpis.map(kpi => ({
                id: kpi.id,
                description: kpi.description || '',
                deadline: kpi.deadline || new Date().toISOString().split('T')[0],
                weight: Number(kpi.weight) || 0,
                completion_percentage: kpi.completion_percentage !== null ? Number(kpi.completion_percentage) : 0,
                supervisor_rating: kpi.supervisor_rating !== null ? Number(kpi.supervisor_rating) : 0,
                created_at: kpi.created_at || new Date().toISOString(),
                review_id: kpi.review_id
              }));
              
              console.log("KPIs recargados después de crear por defecto:", formattedKpis.length);
            }
          }
        }
        
        // IMPORTANTE: Preservar el estado original del formulario
        console.log("Estableciendo datos de revisión con estado:", reviews.status);
        const reviewWithKpis = {
          ...reviews,
          status: reviews.status || 'pendiente',
          long_term_goal: reviews.long_term_goal || '',
          employee_comment: reviews.employee_comment || '',
          supervisor_comment: reviews.supervisor_comment || '',
          kpis: formattedKpis,
          employee_name: fullName
        };
        
        // Depuración para verificar que el estado se preserva correctamente
        console.log("Estado final de la revisión a establecer:", reviewWithKpis.status);
        
        // Establecer los datos de la revisión en el estado
        setReviewData(reviewWithKpis);

        // Mostrar notificaciones según el estado
        if (reviews.status === 'borrador' && !isStatusSubmitted && isOwnReview) {
          toast({
            title: "Formulario en borrador",
            description: "Puedes continuar editando y completar este formulario",
          });
        } else if (isStatusSubmitted) {
          toast({
            title: "Formulario enviado",
            description: isDirectSupervisor ? 
              "Puedes editar las calificaciones de KPI como supervisor directo" : 
              "Este formulario ya ha sido enviado y no puede modificarse",
          });
        } else if (shouldBeReadOnly) {
          toast({
            title: "Modo solo lectura",
            description: "Solo puedes ver este formulario sin editarlo",
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading review:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo cargar la evaluación"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewData();
  }, [employeeId, navigate]);

  return {
    loading,
    reviewData,
    isSupervisor,
    isHrManager,
    isReadOnly,
    currentUserId,
    deadline,
    loadReviewData,
    setReviewData
  };
}
