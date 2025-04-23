
-- Crear tabla para registrar las notificaciones por email
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES performance_reviews(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Añadir índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_email_notifications_user
ON email_notifications(user_id, notification_type);

-- Añadir políticas de seguridad (RLS)
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a los propietarios, supervisores y HR
CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
ON email_notifications
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('supervisor', 'hr_manager')
  )
);

-- Política para permitir inserción desde la función
CREATE POLICY "Solo el sistema puede crear notificaciones"
ON email_notifications
FOR INSERT
WITH CHECK (true);
