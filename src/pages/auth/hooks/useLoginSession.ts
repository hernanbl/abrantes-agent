
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useLoginSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      if (!mounted) return;
      
      try {
        console.log("Login: Verificando sesión");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && mounted) {
          console.log("Login: Sesión activa encontrada");
          // No redirigir automáticamente desde la página de login
          // El usuario será redirigido manualmente después del login exitoso en LoginForm
        }
      } catch (error) {
        console.error("Login: Error al verificar sesión:", error);
      } finally {
        if (mounted) {
          setIsCheckingSession(false);
        }
      }
    };
    
    checkSession();

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Login: Evento de autenticación:", event);
      
      // No redirigir automáticamente desde el hook useLoginSession
      // El componente LoginForm se encargará de redirigir después del login exitoso
    });

    // Limpiar suscripción al desmontar
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); 

  return { isCheckingSession };
};
