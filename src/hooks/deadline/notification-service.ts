
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { NotificationType } from './constants';

/**
 * Muestra una notificación visual según los días restantes
 */
export const showDeadlineNotification = (daysRemaining: number, userId?: string) => {
  let message = "";
  
  if (daysRemaining === 7) {
    message = "Tiene 7 días para completar su evaluación de desempeño.";
  } else if (daysRemaining === 3) {
    message = "Importante: Quedan solo 3 días para completar su evaluación.";
  } else if (daysRemaining === 1) {
    message = "¡Atención! Mañana vence el plazo para completar su evaluación.";
  }

  toast({
    title: "Recordatorio de evaluación",
    description: message,
    variant: daysRemaining === 1 ? "destructive" : "default"
  });
};

/**
 * Envía correos electrónicos según los plazos
 */
export const sendDeadlineEmail = async (daysRemaining: number, userId: string, reviewId?: string) => {
  try {
    let type: NotificationType = 'expired';
    
    if (daysRemaining === 7) {
      type = 'reminder7days';
    } else if (daysRemaining === 3) {
      type = 'reminder3days';
    } else if (daysRemaining === 1) {
      type = 'reminder1day';
    }
    
    // Verificar si ya se envió un correo de este tipo para este usuario y review
    if (reviewId) {
      // En lugar de consultar directamente a la tabla o usar RPC,
      // mantenemos un registro de las notificaciones enviadas
      // directamente en la función Edge
      await supabase.functions.invoke('send-deadline-email', {
        body: { 
          userId, 
          type, 
          reviewId 
        }
      });
    } else {
      // Si no hay reviewId, simplemente enviamos el correo
      await supabase.functions.invoke('send-deadline-email', {
        body: { 
          userId, 
          type 
        }
      });
    }
    
    console.log(`Correo electrónico de tipo ${type} enviado a ${userId}`);
  } catch (error) {
    console.error('Error en sendDeadlineEmail:', error);
  }
};

/**
 * Notifica a supervisores y HR sobre empleados con evaluaciones pendientes
 */
export const notifySupervisorsAndHR = async (userId: string, reviewId?: string) => {
  try {
    // Primero verificar si es una evaluación pendiente
    if (reviewId) {
      const { data: review } = await supabase
        .from('performance_reviews')
        .select('status, supervisor_id')
        .eq('id', reviewId)
        .single();
        
      if (review && review.status !== 'enviado') {
        // Notificar al supervisor si existe
        if (review.supervisor_id) {
          await supabase.functions.invoke('send-deadline-email', {
            body: { 
              userId: review.supervisor_id, 
              type: 'supervisorNotification', 
              employeeIds: [userId] 
            }
          });
        }
        
        // Notificar a HR managers
        const { data: hrManagers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'hr_manager');
          
        if (hrManagers && hrManagers.length > 0) {
          for (const hrManager of hrManagers) {
            await supabase.functions.invoke('send-deadline-email', {
              body: { 
                userId: hrManager.user_id, 
                type: 'hrNotification', 
                employeeIds: [userId] 
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error en notifySupervisorsAndHR:', error);
  }
};
