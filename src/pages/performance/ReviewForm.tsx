import { useParams, useNavigate } from "react-router-dom";
import { ReviewFormLayout } from "./components/ReviewFormLayout";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useReviewData } from "./hooks/useReviewData";
import { saveReviewData, saveKpiRatings, saveSkillsEvaluation } from "./services/reviewDataService";
import { DeadlineAlert } from "./components/DeadlineAlert";
import { toast as sonnerToast } from "sonner";
import { useEffect } from "react";
import { createDefaultKpisIfEmpty } from "./services/createDefaultKpis";
import { supabase } from "@/integrations/supabase/client";

interface ExtendedReviewData {
  id?: string;
  kpis?: any[];
  status?: string;
  employee_name?: string;
}

const ReviewForm = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    loading, 
    reviewData, 
    isSupervisor, 
    isHrManager, 
    isReadOnly, 
    deadline,
    currentUserId,
    loadReviewData,
    setReviewData
  } = useReviewData(employeeId);
  
  const isCurrentUserTheEmployee = !employeeId || currentUserId === employeeId;
  
  // Check if the user is a supervisor viewing their own evaluation
  const isSupervisorViewingOwnEvaluation = isSupervisor && isCurrentUserTheEmployee;
  
  const isDirectSupervisor = isSupervisor && 
                             !isCurrentUserTheEmployee && 
                             ((reviewData?.supervisor_id === currentUserId) || 
                             employeeId !== undefined);
  
  console.log("Supervisor status check:", {
    isSupervisor,
    isCurrentUserTheEmployee,
    reviewDataSupervisorId: reviewData?.supervisor_id,
    currentUserId,
    employeeId,
    isDirectSupervisor,
    isHrManager,
    isSupervisorViewingOwnEvaluation
  });
  
  const formStatus = reviewData?.status || 'pendiente';
  const isSubmitted = formStatus === 'enviado';
  
  const canEditAsEmployee = isCurrentUserTheEmployee && !isSubmitted;
  
  const canEditDevelopmentGoals = (isCurrentUserTheEmployee || isDirectSupervisor) && !isSubmitted;
  
  // When a supervisor is viewing their own evaluation, they should not have supervisor privileges
  const effectiveReadOnly = isReadOnly || 
                          (!canEditAsEmployee && !isDirectSupervisor && !isHrManager) ||
                          (isSupervisorViewingOwnEvaluation && !canEditAsEmployee);
  
  // For supervisor viewing their own evaluation, treat them as a regular employee
  const effectiveIsSupervisor = isSupervisor && !isSupervisorViewingOwnEvaluation;
  const effectiveIsDirectSupervisor = isDirectSupervisor && !isSupervisorViewingOwnEvaluation;
  
  console.log('ReviewForm - Estado del formulario:', { 
    canEditDevelopmentGoals, 
    isCurrentUserTheEmployee, 
    isDirectSupervisor,
    isReadOnly,
    isHrManager,
    effectiveReadOnly,
    formStatus,
    isSupervisor,
    effectiveIsSupervisor,
    isSupervisorViewingOwnEvaluation,
    isSubmitted,
    reviewId: reviewData?.id,
    kpisLength: reviewData?.kpis?.length || 0,
    kpisContent: reviewData?.kpis?.map(k => k.description).join(', ').substring(0, 100) || 'No KPIs'
  });
  
  console.log('ReviewForm props detallados:', { 
    isSupervisor, 
    isHrManager, 
    isReadOnly, 
    status: reviewData?.status,
    employeeId,
    currentUserId,
    reviewDataSupervisorId: reviewData?.supervisor_id,
    isDirectSupervisor,
    canEditDevelopmentGoals,
    isCurrentUserTheEmployee
  });
  
  useEffect(() => {
    const ensureKPIsExist = async () => {
      if (reviewData?.id && (isDirectSupervisor || isHrManager)) {
        console.log("Verificando existencia de KPIs para formulario con ID:", reviewData.id);
        
        if (!reviewData.kpis || reviewData.kpis.length === 0 || 
            !reviewData.kpis.some(k => k.description?.trim())) {
          console.log("No se encontraron KPIs válidos, creando KPIs por defecto");
          const result = await createDefaultKpisIfEmpty(reviewData.id);
          
          if (result) {
            console.log("KPIs verificados/creados correctamente, recargando datos");
            loadReviewData();
          }
        } else {
          console.log("KPIs válidos encontrados:", reviewData.kpis.map(k => k.description));
        }
      }
    };
    
    ensureKPIsExist();
  }, [reviewData?.id, isDirectSupervisor, isHrManager, loadReviewData, reviewData?.kpis]);

  const employeeName = (reviewData as ExtendedReviewData)?.employee_name || "";

  const handleSave = async (formData: any, action: 'save' | 'submit' = 'save') => {
    try {
      if (!reviewData?.id) {
        throw new Error("No hay ID de revisión para guardar");
      }

      if (isSubmitted && action === 'submit' && !isDirectSupervisor && !isHrManager) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "Este formulario ya ha sido enviado y no se puede modificar completamente."
        });
        return;
      }

      if (effectiveReadOnly && action === 'submit') {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "Este formulario no puede ser modificado completamente."
        });
        return;
      }

      const success = await saveReviewData(formData, reviewData.id, action, toast);
      
      if (success) {
        toast({
          title: "Éxito",
          description: action === 'submit' 
            ? "La evaluación ha sido enviada y ya no podrá ser modificada por el empleado"
            : "Los cambios han sido guardados como borrador"
        });
  
        if (action === 'submit') {
          sonnerToast.success("Formulario Enviado", {
            description: "La evaluación ha sido enviada correctamente"
          });
          
          if (isSupervisor) {
            navigate('/supervisor/dashboard');
          } else if (isHrManager) {
            navigate('/hr/dashboard');
          } else {
            navigate('/');
          }
        } else {
          loadReviewData();
        }
      }
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios"
      });
    }
  };

  const handleSaveEmployeeComment = async (employeeComment: string) => {
    try {
      if (!reviewData?.id) {
        throw new Error("No hay ID de revisión para guardar el comentario");
      }

      if (!isCurrentUserTheEmployee) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "Solo puedes modificar tu propio comentario."
        });
        return;
      }

      if (isSubmitted && !isDirectSupervisor && !isHrManager) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "El formulario ya está enviado y no puedes modificar tu comentario."
        });
        return;
      }

      const updatedFormData = {
        ...reviewData,
        employee_comment: employeeComment
      };

      const success = await saveReviewData(updatedFormData, reviewData.id, 'save', toast);
      
      if (success) {
        sonnerToast.success("Comentario Guardado", {
          description: "Tu comentario ha sido guardado correctamente"
        });
        loadReviewData();
      }
    } catch (error: any) {
      console.error('Error in handleSaveEmployeeComment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar tu comentario"
      });
    }
  };

  const handleSaveSupervisorComment = async (supervisorComment: string) => {
    try {
      if (!reviewData?.id) {
        throw new Error("No hay ID de revisión para guardar el comentario");
      }

      if (!isDirectSupervisor && !isHrManager) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "Solo el supervisor puede modificar este comentario."
        });
        return;
      }

      console.log("ReviewForm - Guardando comentario del supervisor:", supervisorComment);
      
      const updatedComment = {
        supervisor_comment: supervisorComment
      };

      const { error } = await supabase
        .from('performance_reviews')
        .update(updatedComment)
        .eq('id', reviewData.id);
        
      if (error) {
        console.error("Error guardando comentario del supervisor:", error);
        throw error;
      }
      
      sonnerToast.success("Comentario Guardado", {
        description: "El comentario del supervisor ha sido guardado correctamente"
      });
      
      if (setReviewData) {
        setReviewData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            supervisor_comment: supervisorComment
          };
        });
      }
      
      loadReviewData();
    } catch (error: any) {
      console.error('Error in handleSaveSupervisorComment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el comentario del supervisor"
      });
    }
  };

  const handleSaveRatings = async () => {
    try {
      if (!reviewData?.id) {
        throw new Error("No hay ID de revisión para guardar");
      }

      // Validaciones básicas
      if (isSupervisorViewingOwnEvaluation) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "No puedes calificar KPIs en tu propia evaluación."
        });
        return;
      }

      if (!isDirectSupervisor && !isHrManager) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "Solo el supervisor directo o el manager de HR pueden calificar KPIs."
        });
        return;
      }

      // IMPORTANTE: Crear una copia profunda de los KPIs para evitar problemas de referencia
      const kpisCopy = JSON.parse(JSON.stringify(reviewData.kpis || []));
      
      console.log("Guardando calificaciones de KPIs (copia profunda):", 
        kpisCopy.map(k => ({
          id: k.id, 
          desc: k.description?.substring(0, 15),
          rating: k.supervisor_rating
        }))
      );
      
      // Mostrar indicador de progreso
      toast({
        title: "Guardando calificaciones",
        description: "Por favor espere..."
      });
      
      // Guardar en Supabase
      const success = await saveKpiRatings(kpisCopy, reviewData.id, toast);
      
      if (success) {
        sonnerToast.success("Calificaciones guardadas", {
          description: "Las calificaciones se han guardado correctamente"
        });
        
        // FORZAR UNA CONSULTA DIRECTA A SUPABASE para obtener los valores actualizados
        // en lugar de confiar en el estado local que podría no actualizarse correctamente
        console.log("Consultando datos actualizados directamente de Supabase...");
        
        const { data: refreshedKpis, error: refreshError } = await supabase
          .from('performance_kpis')
          .select('*')
          .eq('review_id', reviewData.id)
          .order('created_at', { ascending: true });
          
        if (refreshError) {
          console.error("Error al recargar KPIs:", refreshError);
        }
        
        // Si se obtuvieron KPIs actualizados, actualizar el estado local
        if (refreshedKpis && refreshedKpis.length > 0) {
          console.log("KPIs recargados directamente desde Supabase:", 
            refreshedKpis.map(k => ({
              id: k.id, 
              rating: k.supervisor_rating
            }))
          );
          
          // Formatear los KPIs para el estado local
          const formattedKpis = refreshedKpis.map(kpi => ({
            id: kpi.id,
            description: kpi.description || '',
            deadline: kpi.deadline || new Date().toISOString().split('T')[0],
            weight: Number(kpi.weight) || 0,
            completion_percentage: kpi.completion_percentage !== null ? Number(kpi.completion_percentage) : 0,
            supervisor_rating: kpi.supervisor_rating !== null ? Number(kpi.supervisor_rating) : 0,
            created_at: kpi.created_at || new Date().toISOString(),
            review_id: kpi.review_id
          }));
          
          // Actualizar el estado directamente sin esperar a loadReviewData
          if (setReviewData && reviewData) {
            console.log("Actualizando estado local con KPIs recargados");
            setReviewData({
              ...reviewData,
              kpis: formattedKpis
            });
          }
        } else {
          // Si no se pudieron recargar los KPIs, intentar con el método estándar
          console.log("No se pudieron recargar KPIs, usando método estándar");
          
          // Esperar un momento antes de recargar los datos
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadReviewData();
        }
      }
    } catch (error: any) {
      console.error('Error guardando calificaciones:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron guardar las calificaciones"
      });
    }
  };

  const handleSaveSkills = async () => {
    try {
      if (!reviewData?.id) {
        throw new Error("No hay ID de revisión para guardar");
      }

      // Validaciones básicas
      if (isSupervisorViewingOwnEvaluation) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "No puedes evaluar competencias en tu propia evaluación."
        });
        return;
      }

      if (!isDirectSupervisor && !isHrManager) {
        toast({
          variant: "destructive",
          title: "No permitido",
          description: "Solo el supervisor directo o el manager de HR pueden evaluar competencias."
        });
        return;
      }
      
      // Crear una copia profunda de las competencias
      const skillsCopy = JSON.parse(JSON.stringify(reviewData.skills || []));
      
      if (!skillsCopy || skillsCopy.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No hay competencias para guardar"
        });
        return;
      }
      
      // Mostrar toast de progreso
      toast({
        title: "Guardando competencias",
        description: "Por favor espere..."
      });
      
      // Intentar usar método estándar primero
      try {
        console.log("Intentando guardar competencias con saveSkillsEvaluation");
        const success = await saveSkillsEvaluation(skillsCopy, reviewData.id, toast);
        
        if (success) {
          sonnerToast.success("Evaluación Guardada", {
            description: "La evaluación de competencias ha sido guardada correctamente"
          });
          
          // Forzar una recarga completa desde Supabase
          await refreshSkillsDataFromSupabase();
          return;
        } else {
          console.log("saveSkillsEvaluation falló, intentando método alternativo");
        }
      } catch (saveError) {
        console.error("Error usando saveSkillsEvaluation:", saveError);
      }
      
      // Si el método estándar falla, intentar método directo
      try {
        // Primero eliminar todas las competencias existentes
        const { error: deleteError } = await supabase
          .from('skill_evaluations')
          .delete()
          .eq('review_id', reviewData.id);
          
        if (deleteError) {
          console.error("Error al eliminar competencias existentes:", deleteError);
          throw deleteError;
        }
        
        // Preparar las competencias para inserción
        const skillsToInsert = skillsCopy
          .filter(skill => skill.name && skill.level)
          .map(skill => ({
            review_id: reviewData.id,
            skill_name: skill.name,
            level: skill.level || 'medio'
          }));
        
        console.log("Competencias a insertar:", skillsToInsert);
        
        // Insertar todas las competencias de una vez
        const { data: insertedSkills, error: insertError } = await supabase
          .from('skill_evaluations')
          .insert(skillsToInsert)
          .select();
            
        if (insertError) {
          console.error("Error al insertar competencias:", insertError);
          
          // Si hay error, intentar una por una
          console.log("Intentando insertar competencias una por una");
          
          let insertedCount = 0;
          for (const skill of skillsToInsert) {
            const { error: singleInsertError } = await supabase
              .from('skill_evaluations')
              .insert(skill);
              
            if (!singleInsertError) {
              insertedCount++;
            }
          }
          
          if (insertedCount === 0) {
            throw new Error("No se pudo guardar ninguna competencia");
          }
          
          sonnerToast.info("Guardado parcial", {
            description: `Se guardaron ${insertedCount} de ${skillsToInsert.length} competencias`
          });
        } else {
          console.log("Competencias guardadas correctamente:", insertedSkills);
          
          sonnerToast.success("Evaluación Guardada", {
            description: "La evaluación de competencias ha sido guardada correctamente"
          });
        }
        
        // Forzar una recarga completa desde Supabase
        await refreshSkillsDataFromSupabase();
        
      } catch (directError) {
        console.error("Error guardando competencias:", directError);
        toast({
          variant: "destructive",
          title: "Error",
          description: directError.message || "No se pudieron guardar las competencias"
        });
      }
      
    } catch (error) {
      console.error('Error general guardando competencias:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la evaluación de competencias"
      });
    }
  };
  
  // Función para recargar los datos de competencias directamente desde Supabase
  const refreshSkillsDataFromSupabase = async () => {
    if (!reviewData?.id) return;
    
    try {
      console.log("Recargando datos de competencias desde Supabase");
      
      // Obtener las competencias actualizadas directamente desde Supabase
      const { data: supabaseSkills, error } = await supabase
        .from('skill_evaluations')
        .select('skill_name, level')
        .eq('review_id', reviewData.id);
        
      if (error) {
        console.error("Error recargando competencias desde Supabase:", error);
        return;
      }
      
      if (supabaseSkills && supabaseSkills.length > 0) {
        console.log("Competencias recargadas desde Supabase:", supabaseSkills);
        
        // Obtener los skills actuales para preservar cualquier información adicional
        const currentSkills = [...(reviewData.skills || [])];
        
        // Actualizar los niveles de competencias con los datos de Supabase
        const updatedSkills = currentSkills.map(skill => {
          const matchingSkill = supabaseSkills.find(s => s.skill_name === skill.name);
          if (matchingSkill) {
            return { ...skill, level: matchingSkill.level };
          }
          return skill;
        });
        
        // Actualizar el estado de reviewData con las competencias actualizadas
        if (setReviewData) {
          setReviewData(prevData => {
            if (!prevData) return prevData;
            return {
              ...prevData,
              skills: updatedSkills
            };
          });
          
          console.log("Estado de reviewData actualizado con las competencias actualizadas");
        }
      }
      
      // También cargar datos completos (opcional, puede causar una recarga extra)
      await loadReviewData();
      
    } catch (error) {
      console.error("Error en refreshSkillsDataFromSupabase:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Cargando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <DeadlineAlert
        isExpired={deadline.isExpired}
        daysRemaining={deadline.daysRemaining}
        formattedDeadline={deadline.formattedDeadline}
        isSupervisor={effectiveIsSupervisor}
        isHrManager={isHrManager}
        loading={loading}
      />
      
      <ReviewFormLayout
        reviewData={reviewData}
        onSave={handleSave}
        isSupervisor={effectiveIsSupervisor}
        isHrManager={isHrManager}
        isReadOnly={effectiveReadOnly} 
        showSubmitButton={!isSubmitted && !effectiveReadOnly}
        showSaveButton={!isSubmitted && !effectiveReadOnly}
        onSaveRatings={handleSaveRatings}
        onSaveSkills={handleSaveSkills}
        isCurrentUserTheEmployee={isCurrentUserTheEmployee}
        isDirectSupervisor={effectiveIsDirectSupervisor}
        canEditDevelopmentGoals={canEditDevelopmentGoals && !isSubmitted}
        onSaveEmployeeComment={handleSaveEmployeeComment}
        onSaveSupervisorComment={handleSaveSupervisorComment}
        employeeName={reviewData?.employee_name || ""}
        status={formStatus}
      />
    </div>
  );
};

export default ReviewForm;
