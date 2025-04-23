import { supabase } from "@/integrations/supabase/client";
import type { KPI, Skill } from "../types/reviewTypes";

export async function loadReview(userId: string) {
  console.log('Buscando todas las revisiones para usuario:', userId);
  const { data, error } = await supabase
    .from("performance_reviews")
    .select('*')
    .eq('employee_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al cargar revisiones:', error);
    throw error;
  }
  
  console.log('Todas las revisiones encontradas:', data);

  // Si hay una revisión enviada (submitted), la retornamos
  const submittedReview = data?.find(review => review.status === 'submitted');
  if (submittedReview) {
    console.log('Encontrada revisión enviada:', submittedReview);
    return submittedReview;
  }

  // Si no hay revisión enviada, retornamos el último borrador
  const draftReview = data?.[0];
  if (draftReview) {
    console.log('Retornando último borrador:', draftReview);
    return draftReview;
  }

  console.log('No se encontraron revisiones');
  return null;
}

export async function createNewReview(userId: string, initialData: any) {
  console.log('Creando nueva revisión para usuario:', userId);
  const { data, error } = await supabase
    .from("performance_reviews")
    .insert({
      employee_id: userId,
      supervisor_id: userId, // Por ahora el mismo usuario es supervisor
      current_position: initialData.currentPosition,
      department: initialData.department,
      position_start_date: initialData.positionStartDate,
      status: 'draft',
      review_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear revisión:', error);
    throw error;
  }

  console.log('Nueva revisión creada:', data);
  return data;
}

export async function loadReviewData(reviewId: string) {
  console.log('Cargando datos adicionales para revisión:', reviewId);
  
  try {
    const [kpisData, skillsData, goalsData] = await Promise.all([
      supabase
        .from("performance_kpis")
        .select('*')
        .eq('review_id', reviewId),
      supabase
        .from("skill_evaluations")
        .select('skill_name, level')
        .eq('review_id', reviewId),
      supabase
        .from("development_goals")
        .select('description')
        .eq('review_id', reviewId)
    ]);

    if (kpisData.error) throw kpisData.error;
    if (skillsData.error) throw skillsData.error;
    if (goalsData.error) throw goalsData.error;

    console.log('Datos adicionales cargados:', {
      kpis: kpisData.data,
      skills: skillsData.data,
      goals: goalsData.data
    });

    return { kpisData, skillsData, goalsData };
  } catch (error) {
    console.error('Error al cargar datos adicionales:', error);
    throw error;
  }
}

export async function saveReviewData(
  reviewId: string, 
  formData: any, 
  kpis: KPI[], 
  skills: Skill[], 
  developmentGoals: string[],
  employeeComment: string,
  supervisorComment: string,
  status: 'draft' | 'submitted'
) {
  console.log('Guardando datos de revisión:', {
    reviewId,
    formData,
    kpis,
    skills,
    developmentGoals,
    status
  });

  try {
    // Primero actualizamos la revisión principal
    const { error: reviewError } = await supabase
      .from("performance_reviews")
      .update({
        current_position: formData.currentPosition,
        department: formData.department,
        position_start_date: formData.positionStartDate,
        long_term_goal: formData.longTermGoal,
        employee_comment: employeeComment,
        supervisor_comment: supervisorComment,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (reviewError) throw reviewError;

    // Eliminamos los datos relacionados existentes
    const deletePromises = await Promise.all([
      supabase.from("performance_kpis").delete().eq('review_id', reviewId),
      supabase.from("skill_evaluations").delete().eq('review_id', reviewId),
      supabase.from("development_goals").delete().eq('review_id', reviewId),
    ]);

    // Verificamos errores en las eliminaciones
    deletePromises.forEach(({error}) => {
      if (error) throw error;
    });

    console.log('Insertando KPIs:', kpis);
    console.log('Insertando skills:', skills);
    console.log('Insertando metas:', developmentGoals);

    // Insertamos los nuevos datos
    const insertPromises = await Promise.all([
      supabase.from("performance_kpis").insert(
        kpis.filter(kpi => kpi.description && kpi.deadline).map((kpi) => ({
          review_id: reviewId,
          description: kpi.description,
          deadline: kpi.deadline,
          weight: kpi.weight,
          completion_percentage: status === 'submitted' ? 0 : null, // Inicializamos en 0 al enviar
        }))
      ),
      supabase.from("skill_evaluations").insert(
        skills.filter(skill => skill.level).map((skill) => ({
          review_id: reviewId,
          skill_name: skill.name,
          level: skill.level,
        }))
      ),
      supabase.from("development_goals").insert(
        developmentGoals.filter(goal => goal.trim()).map((goal) => ({
          review_id: reviewId,
          description: goal,
        }))
      ),
    ]);

    // Verificamos errores en las inserciones
    insertPromises.forEach(({error}) => {
      if (error) throw error;
    });

    console.log('Datos guardados exitosamente');
  } catch (error) {
    console.error('Error al guardar datos:', error);
    throw error;
  }
}
