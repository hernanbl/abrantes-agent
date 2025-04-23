
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface EmailRequest {
  userId: string;
  type: 'reminder7days' | 'reminder3days' | 'reminder1day' | 'expired' | 'supervisorNotification' | 'hrNotification';
  reviewId?: string;
  employeeIds?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const { userId, type, reviewId, employeeIds } = await req.json() as EmailRequest;
    
    // Si es una notificación de recordatorio y tiene reviewId, verificar si ya se envió
    if (reviewId && ['reminder7days', 'reminder3days', 'reminder1day', 'expired'].includes(type)) {
      // Verificar si ya existe una notificación de este tipo
      const { data: existingNotification, error: queryError } = await supabase
        .from('email_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('review_id', reviewId)
        .eq('notification_type', type)
        .maybeSingle();
      
      if (queryError) {
        console.error('Error verificando notificaciones existentes:', queryError);
      } else if (existingNotification) {
        // Ya se envió esta notificación, no enviar de nuevo
        return new Response(
          JSON.stringify({ success: true, message: "Notificación ya enviada previamente" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }
    
    // Obtener información del usuario
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("first_name, last_name, id")
      .eq("id", userId)
      .single();
      
    if (userError) {
      throw new Error(`Error obteniendo datos del usuario: ${userError.message}`);
    }
    
    const fullName = `${userData.first_name} ${userData.last_name}`;
    
    // Obtener detalles adicionales según el tipo de notificación
    let emailSubject = "";
    let emailContent = "";
    let recipientEmail = "";
    
    // Obtener email del usuario desde auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser.user) {
      throw new Error(`Error obteniendo email del usuario: ${authError?.message || "Usuario no encontrado"}`);
    }
    
    recipientEmail = authUser.user.email;
    
    // Construir contenido del email según el tipo
    switch (type) {
      case 'reminder7days':
        emailSubject = "Recordatorio: 7 días para completar su evaluación de desempeño";
        emailContent = `
          <h1>Estimado/a ${fullName},</h1>
          <p>Le recordamos que tiene 7 días para completar su evaluación de desempeño.</p>
          <p>Por favor, acceda a la plataforma de evaluaciones para completar el formulario lo antes posible.</p>
          <p>Este es un recordatorio automático. No responda a este correo.</p>
        `;
        break;
        
      case 'reminder3days':
        emailSubject = "Importante: Solo 3 días para completar su evaluación de desempeño";
        emailContent = `
          <h1>Estimado/a ${fullName},</h1>
          <p><strong>¡Atención!</strong> Quedan solo 3 días para completar su evaluación de desempeño.</p>
          <p>Es importante que complete el formulario lo antes posible para evitar la expiración del plazo.</p>
          <p>Este es un recordatorio automático. No responda a este correo.</p>
        `;
        break;
        
      case 'reminder1day':
        emailSubject = "Último aviso: 24 horas para completar su evaluación";
        emailContent = `
          <h1>Estimado/a ${fullName},</h1>
          <p><strong>¡Último aviso!</strong> Queda solo 1 día para completar su evaluación de desempeño.</p>
          <p>Si no completa el formulario en las próximas 24 horas, perderá la oportunidad de participar en esta evaluación.</p>
          <p>Este es un recordatorio automático. No responda a este correo.</p>
        `;
        break;
        
      case 'expired':
        emailSubject = "Plazo expirado: Evaluación de desempeño";
        emailContent = `
          <h1>Estimado/a ${fullName},</h1>
          <p>El plazo para completar su evaluación de desempeño ha finalizado.</p>
          <p>Ya no podrá realizar cambios en el formulario. Si requiere información adicional, por favor contacte a su supervisor o al departamento de Recursos Humanos.</p>
          <p>Este es un mensaje automático. No responda a este correo.</p>
        `;
        break;
        
      case 'supervisorNotification':
      case 'hrNotification':
        // Para notificaciones a supervisores y HR, necesitamos datos de los empleados
        if (!employeeIds || employeeIds.length === 0) {
          throw new Error("No se especificaron IDs de empleados para la notificación");
        }
        
        // Obtener datos de los empleados
        const { data: employeesData, error: employeesError } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .in("id", employeeIds);
          
        if (employeesError) {
          throw new Error(`Error obteniendo datos de empleados: ${employeesError.message}`);
        }
        
        const employeesList = employeesData.map(emp => `${emp.first_name} ${emp.last_name}`).join("<br>");
        
        emailSubject = "Notificación: Empleados con evaluaciones pendientes";
        emailContent = `
          <h1>Estimado/a ${fullName},</h1>
          <p>Los siguientes empleados no han completado su evaluación de desempeño antes del vencimiento del plazo:</p>
          <div style="margin: 20px; padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9;">
            ${employeesList}
          </div>
          <p>Por favor, tome las acciones correspondientes.</p>
          <p>Este es un mensaje automático. No responda a este correo.</p>
        `;
        break;
    }
    
    // Enviar el email usando Resend
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: "Evaluaciones <notificaciones@tuempresa.com>", // Actualizar con tu dominio verificado
      to: [recipientEmail],
      subject: emailSubject,
      html: emailContent,
    });
    
    if (emailError) {
      throw new Error(`Error enviando correo: ${emailError}`);
    }
    
    // Registrar el envío en la base de datos
    if (reviewId && ['reminder7days', 'reminder3days', 'reminder1day', 'expired'].includes(type)) {
      await supabase.from("email_notifications")
        .insert({
          user_id: userId,
          review_id: reviewId,
          notification_type: type,
          sent_at: new Date().toISOString()
        });
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Email enviado correctamente" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Error en la función:", error.message);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
