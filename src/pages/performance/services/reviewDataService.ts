import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateFormForSubmission } from "../utils/formValidation";

export const saveReviewData = async (
  formData: any, 
  reviewId: string, 
  action: 'save' | 'submit' = 'save',
  toast: ReturnType<typeof useToast>["toast"]
) => {
  try {
    if (!reviewId) {
      throw new Error("No hay ID de revisión para guardar");
    }

    console.log("Enviando datos al servidor:", formData);
    console.log("Guardando formulario con datos:", formData);
    
    // Si va a enviar, validar que todos los campos requeridos estén completos
    if (action === 'submit') {
      if (!validateFormForSubmission(formData, formData.kpis || [], formData.goals || [], toast)) {
        return false;
      }
    }
    
    const status = action === 'submit' ? 'enviado' : 'borrador';

    const updateData = {
      department: formData.department,
      current_position: formData.current_position,
      position_start_date: formData.position_start_date,
      long_term_goal: formData.long_term_goal || '',
      employee_comment: formData.employee_comment || '',
      supervisor_comment: formData.supervisor_comment || '',
      status
    } as const;

    console.log("Datos a actualizar:", updateData);

    const { error: updateError } = await supabase
      .from('performance_reviews')
      .update(updateData)
      .eq('id', reviewId);

    if (updateError) {
      console.error("Error actualizando revisión:", updateError);
      throw updateError;
    }

    // Detect if this is just a comment update
    const isCommentUpdate = 
      Object.keys(formData).length <= 2 && 
      (formData.hasOwnProperty('employee_comment') || 
       formData.hasOwnProperty('supervisor_comment'));
    
    // Solo actualizamos los KPIs si hay datos para actualizar y no estamos guardando comentarios individuales
    const shouldUpdateKpis = formData.kpis?.length > 0 && !isCommentUpdate;
    
    if (shouldUpdateKpis) {
      console.log("Actualizando KPIs:", formData.kpis);
      
      // Primero, eliminar los KPIs existentes para esta revisión
      const { error: deleteKpisError } = await supabase
        .from('performance_kpis')
        .delete()
        .eq('review_id', reviewId);

      if (deleteKpisError) {
        console.error("Error eliminando KPIs existentes:", deleteKpisError);
        throw deleteKpisError;
      }

      // Luego, insertar los nuevos KPIs
      const kpisToInsert = formData.kpis
        .filter((kpi: any) => kpi.description && kpi.description.trim() !== '')
        .map((kpi: any) => {
          let rating = null;
          // Si la calificación existe y es un número válido (incluyendo 0)
          if (kpi.supervisor_rating !== undefined && kpi.supervisor_rating !== null) {
            const numRating = Number(kpi.supervisor_rating);
            // Verificar si es un número válido y está en el rango correcto (0-10)
            if (!isNaN(numRating)) {
              rating = Math.min(Math.max(numRating, 0), 10);
            }
          }
          
          return {
            review_id: reviewId,
            description: kpi.description || '',
            deadline: kpi.deadline || new Date().toISOString().split('T')[0],
            weight: Number(kpi.weight) || 0,
            completion_percentage: kpi.completion_percentage || 0,
            supervisor_rating: rating
          };
        });
          
      if (kpisToInsert.length > 0) {
        const { error: kpisError } = await supabase
          .from('performance_kpis')
          .insert(kpisToInsert);

        if (kpisError) {
          console.error("Error actualizando KPIs:", kpisError);
          throw kpisError;
        }
      }
    } else {
      console.log("Omitiendo actualización de KPIs para esta operación");
    }

    // Solo actualizamos las skills si hay datos para actualizar
    const shouldUpdateSkills = formData.skills?.length > 0 && !isCommentUpdate;
    
    if (shouldUpdateSkills) {
      // Primero, eliminar las skills existentes para esta revisión
      const { error: deleteSkillsError } = await supabase
        .from('skill_evaluations')
        .delete()
        .eq('review_id', reviewId);

      if (deleteSkillsError) {
        console.error("Error eliminando skills existentes:", deleteSkillsError);
        throw deleteSkillsError;
      }

      // Luego, insertar las nuevas skills
      const skillsToInsert = formData.skills
        .filter((skill: any) => skill.name)
        .map((skill: any) => ({
          review_id: reviewId,
          skill_name: skill.name,
          level: skill.level || 'medio'
        }));
          
      if (skillsToInsert.length > 0) {
        const { error: skillsError } = await supabase
          .from('skill_evaluations')
          .insert(skillsToInsert);

        if (skillsError) {
          console.error("Error actualizando skills:", skillsError);
          throw skillsError;
        }
      }
    }

    // Las metas se guardan directamente desde el componente DevelopmentGoals
    // cuando se agregan o eliminan individualmente, así que no necesitamos
    // eliminar y recrear todas las metas aquí.
    // 
    // Solo guardamos las metas si se han modificado fuera del flujo normal
    // de agregar/eliminar, como cuando se envía el formulario completo.
    if (action === 'submit' && formData.goals?.length > 0) {
      // Consultar las metas existentes para esta revisión
      const { data: existingGoals, error: goalsQueryError } = await supabase
        .from('development_goals')
        .select('description')
        .eq('review_id', reviewId);
      
      if (goalsQueryError) {
        console.error("Error consultando metas existentes:", goalsQueryError);
      }
      
      // Si hay metas nuevas que no existen en la base de datos, agregarlas
      if (existingGoals) {
        const existingDescriptions = new Set(existingGoals.map(g => g.description));
        
        const newGoals = formData.goals
          .filter((goal: string) => goal && goal.trim() !== '' && !existingDescriptions.has(goal.trim()))
          .map((goal: string) => ({
            review_id: reviewId,
            description: goal.trim()
          }));
          
        if (newGoals.length > 0) {
          const { error: goalsError } = await supabase
            .from('development_goals')
            .insert(newGoals);
  
          if (goalsError) {
            console.error("Error actualizando metas nuevas:", goalsError);
            throw goalsError;
          }
        }
      }
    }

    return true;
  } catch (error: any) {
    console.error('Error saving review:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "No se pudieron guardar los cambios"
    });
    return false;
  }
};

// Método directo para guardar calificaciones en Supabase
export const saveKpiRatings = async (
  kpis: any[],
  reviewId: string,
  toast: ReturnType<typeof useToast>["toast"]
) => {
  try {
    console.log("[saveKpiRatings] Iniciando guardado con reviewId:", reviewId);
    
    if (!reviewId || !kpis?.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Datos incompletos para guardar calificaciones"
      });
      return false;
    }
    
    const validKpis = kpis.filter(kpi => kpi.id);
    
    // Información detallada para depuración
    console.log("[saveKpiRatings] KPIs a actualizar:", validKpis.map(k => ({
      id: k.id,
      desc: k.description?.substring(0, 15),
      rating: k.supervisor_rating
    })));
    
    let successCount = 0;
    
    // Guardar cada KPI de forma individual y secuencial
    for (const kpi of validKpis) {
      // Asegurar que el valor es numérico
      let rating = null;
      
      if (kpi.supervisor_rating !== undefined && kpi.supervisor_rating !== null) {
        // Convertir explícitamente a número
        const numRating = parseFloat(String(kpi.supervisor_rating));
        if (!isNaN(numRating)) {
          rating = Math.min(Math.max(numRating, 0), 10); // Limitar entre 0 y 10
        }
      }
      
      console.log(`[saveKpiRatings] Procesando KPI ${kpi.id}: valor=${rating} (${typeof rating})`);
      
      // Realizar la actualización usando SQL directo para mayor confiabilidad
      const { data, error } = await supabase
        .from('performance_kpis')
        .update({ supervisor_rating: rating })
        .eq('id', kpi.id)
        .select('id, supervisor_rating');
      
      if (error) {
        console.error(`[saveKpiRatings] Error al actualizar KPI ${kpi.id}:`, error);
      } else {
        console.log(`[saveKpiRatings] KPI ${kpi.id} actualizado:`, data);
        successCount++;
      }
      
      // Pequeña pausa para evitar problemas de concurrencia
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Verificar que se han guardado las calificaciones
    console.log(`[saveKpiRatings] ${successCount} de ${validKpis.length} KPIs actualizados correctamente`);
    
    // Recuperar los datos actualizados para verificar
    const { data: updatedKpis, error: checkError } = await supabase
      .from('performance_kpis')
      .select('id, description, supervisor_rating')
      .eq('review_id', reviewId);
    
    if (checkError) {
      console.error("[saveKpiRatings] Error verificando actualizaciones:", checkError);
    } else {
      console.log("[saveKpiRatings] Valores actuales en la base de datos:", 
        updatedKpis.map(k => ({ id: k.id, rating: k.supervisor_rating }))
      );
    }
    
    toast({
      title: "Calificaciones guardadas",
      description: `Se han guardado ${successCount} calificaciones correctamente`
    });
    
    return true;
  } catch (error: any) {
    console.error('[saveKpiRatings] Error:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "No se pudieron guardar las calificaciones"
    });
    return false;
  }
};

export const saveSkillsEvaluation = async (
  skills: any[],
  reviewId: string,
  toast: ReturnType<typeof useToast>["toast"]
) => {
  try {
    console.log("[saveSkillsEvaluation] Iniciando guardado de competencias con reviewId:", reviewId);
    console.log("[saveSkillsEvaluation] Competencias a guardar:", JSON.stringify(skills, null, 2));

    if (!reviewId) {
      console.error("[saveSkillsEvaluation] Error: No hay ID de revisión");
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay ID de revisión para guardar evaluación de competencias"
      });
      return false;
    }

    if (!skills || skills.length === 0) {
      console.error("[saveSkillsEvaluation] Error: No hay competencias para guardar");
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay competencias para guardar"
      });
      return false;
    }
    
    // Verificar primero si hay datos válidos antes de continuar
    const validSkills = skills.filter(skill => skill.name && skill.level);
    if (validSkills.length === 0) {
      console.error("[saveSkillsEvaluation] Error: Ninguna competencia tiene datos completos");
      toast({
        variant: "destructive",
        title: "Error en datos",
        description: "Las competencias no tienen datos válidos para guardar"
      });
      return false;
    }
    
    // Primero, verificar si ya existen competencias para esta revisión
    const { data: existingSkills, error: checkError } = await supabase
      .from('skill_evaluations')
      .select('id, skill_name')
      .eq('review_id', reviewId);
    
    if (checkError) {
      console.error("[saveSkillsEvaluation] Error verificando competencias existentes:", checkError);
      throw checkError;
    }
    
    console.log(`[saveSkillsEvaluation] Se encontraron ${existingSkills?.length || 0} competencias existentes`);
    
    // Si existen competencias, eliminarlas
    if (existingSkills && existingSkills.length > 0) {
      console.log(`[saveSkillsEvaluation] Eliminando ${existingSkills.length} competencias existentes`);
      const { error: deleteSkillsError } = await supabase
        .from('skill_evaluations')
        .delete()
        .eq('review_id', reviewId);

      if (deleteSkillsError) {
        console.error("[saveSkillsEvaluation] Error eliminando competencias existentes:", deleteSkillsError);
        throw deleteSkillsError;
      }
    }

    // Preparar las competencias para inserción, asegurando que los campos sean válidos
    const skillsToInsert = validSkills.map((skill: any) => ({
      review_id: reviewId,
      skill_name: skill.name,
      level: skill.level || 'medio'
    }));
    
    console.log(`[saveSkillsEvaluation] Insertar ${skillsToInsert.length} competencias:`, 
      skillsToInsert.map(s => `${s.skill_name}: ${s.level}`).join(', '));
        
    // Insertar las competencias preparadas
    const { data: insertedSkills, error: skillsError } = await supabase
      .from('skill_evaluations')
      .insert(skillsToInsert)
      .select();

    if (skillsError) {
      console.error("[saveSkillsEvaluation] Error actualizando competencias:", skillsError);
      throw skillsError;
    }
    
    // Verificar que las competencias se guardaron correctamente
    const { data: verifySkills, error: verifyError } = await supabase
      .from('skill_evaluations')
      .select('id, skill_name, level')
      .eq('review_id', reviewId);
      
    if (verifyError) {
      console.error("[saveSkillsEvaluation] Error verificando competencias guardadas:", verifyError);
    } else {
      console.log("[saveSkillsEvaluation] Verificación de competencias guardadas:", 
        verifySkills?.map(s => ({ id: s.id, name: s.skill_name, level: s.level })));
    }
    
    if (verifySkills && verifySkills.length > 0) {
      console.log(`[saveSkillsEvaluation] Se verificaron ${verifySkills.length} competencias guardadas exitosamente`);
      // Mostrar toast de éxito
      toast({
        title: "Evaluación guardada",
        description: "La evaluación de competencias ha sido guardada exitosamente"
      });
      return true;
    } else {
      console.error("[saveSkillsEvaluation] No se encontraron competencias después de guardar");
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron verificar las competencias guardadas"
      });
      return false;
    }
  } catch (error: any) {
    console.error('[saveSkillsEvaluation] Error:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "No se pudo guardar la evaluación de competencias"
    });
    return false;
  }
};
