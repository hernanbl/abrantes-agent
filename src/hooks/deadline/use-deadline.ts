
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import { UseDeadlineProps, DeadlineInfo } from './types';
import { NOTIFICATION_DAYS } from './constants';
import { calculateDeadline, isReviewComplete } from './deadline-calculator';
import { 
  showDeadlineNotification, 
  sendDeadlineEmail, 
  notifySupervisorsAndHR 
} from './notification-service';

export function useDeadline({ userId, reviewId }: UseDeadlineProps) {
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo>({
    isExpired: false,
    daysRemaining: 30,
    deadlineDate: null,
    formattedDeadline: ''
  });

  useEffect(() => {
    const loadUserDeadline = async () => {
      try {
        let currentUserId = userId;
        
        if (!currentUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          currentUserId = user.id;
        }

        // Calcular fechas límite
        const deadline = await calculateDeadline(currentUserId);
        if (!deadline) return;
        
        setDeadlineInfo(deadline);

        // Si el plazo está activo, verificar si debemos mostrar notificaciones
        if (!deadline.isExpired && NOTIFICATION_DAYS.includes(deadline.daysRemaining)) {
          if (reviewId) {
            // Solo mostrar notificación si la revisión no está completa
            const reviewCompleted = await isReviewComplete(reviewId);
            if (!reviewCompleted) {
              showDeadlineNotification(deadline.daysRemaining, currentUserId);
              sendDeadlineEmail(deadline.daysRemaining, currentUserId, reviewId);
            }
          } else {
            showDeadlineNotification(deadline.daysRemaining, currentUserId);
            sendDeadlineEmail(deadline.daysRemaining, currentUserId);
          }
        }

        // Si el plazo expiró hoy, mostrar notificación final
        if (deadline.daysRemaining === 0) {
          toast({
            title: "Plazo expirado",
            description: "El período para completar la evaluación ha finalizado.",
            variant: "destructive"
          });
          
          // Enviar email de expiración
          sendDeadlineEmail(0, currentUserId, reviewId);
          
          // Notificar a supervisores y HR sobre empleados con evaluaciones pendientes
          notifySupervisorsAndHR(currentUserId, reviewId);
        }

      } catch (error) {
        console.error("Error en loadUserDeadline:", error);
      }
    };

    loadUserDeadline();
  }, [userId, reviewId]);

  return deadlineInfo;
}
