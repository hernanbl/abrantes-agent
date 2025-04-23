
import { supabase } from '@/integrations/supabase/client';
import { DeadlineInfo } from './types';
import { EVALUATION_PERIOD_DAYS } from './constants';

/**
 * Calcula información de plazo basado en la fecha de creación del usuario
 */
export const calculateDeadline = async (userId: string): Promise<DeadlineInfo | null> => {
  try {
    // Obtener la fecha de creación del usuario
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error("Error al obtener fecha de registro:", userError);
      return null;
    }

    if (!userData) {
      console.error("No se encontró información del usuario");
      return null;
    }

    // Calcular la fecha límite - exactamente 30 días después del registro
    const creationDate = new Date(userData.created_at);
    const deadlineDate = new Date(creationDate);
    deadlineDate.setDate(deadlineDate.getDate() + EVALUATION_PERIOD_DAYS);
    
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isExpired = diffDays <= 0;
    const formattedDeadline = deadlineDate.toLocaleDateString();

    console.log(`Usuario registrado: ${creationDate.toLocaleDateString()}, Fecha límite: ${formattedDeadline}, Días restantes: ${diffDays}`);

    return {
      isExpired,
      daysRemaining: Math.max(0, diffDays),
      deadlineDate,
      formattedDeadline
    };
  } catch (error) {
    console.error("Error al calcular plazo:", error);
    return null;
  }
};

/**
 * Verifica si un review ya fue completado
 */
export const isReviewComplete = async (reviewId: string): Promise<boolean> => {
  try {
    const { data: review } = await supabase
      .from('performance_reviews')
      .select('status')
      .eq('id', reviewId)
      .single();

    return review?.status === 'enviado';
  } catch (error) {
    console.error("Error al verificar estado de la revisión:", error);
    return false;
  }
};
