
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const RouteGuard = ({ children, allowedRoles }: RouteGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Add a flag to prevent multiple redirect attempts
    let redirectAttempted = false;
    
    const checkAuth = async () => {
      try {
        console.log("RouteGuard: Verificando autenticación en ruta:", location.pathname);
        
        // Obtener sesión del usuario
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log("RouteGuard: No hay usuario autenticado, redirigiendo a login");
          if (!redirectAttempted && !location.pathname.startsWith('/auth/')) {
            redirectAttempted = true;
            // Usar replace para evitar loops en el historial
            navigate('/auth/login', { replace: true });
          } else {
            // Si ya estamos en una ruta de autenticación, no redirigimos
            setIsAuthorized(false);
          }
          return;
        }

        // Si no se requieren roles específicos, permitir acceso
        if (!allowedRoles) {
          console.log("RouteGuard: No se requieren roles específicos, acceso permitido");
          setIsAuthorized(true);
          return;
        }

        // Verificar roles del usuario
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error("RouteGuard: Error al obtener roles:", error);
          if (!redirectAttempted && !location.pathname.startsWith('/auth/')) {
            redirectAttempted = true;
            navigate('/auth/login', { replace: true });
          }
          return;
        }

        const userRolesList = userRoles?.map(r => r.role) || [];
        
        console.log("RouteGuard: Roles del usuario:", userRolesList);
        console.log("RouteGuard: Roles permitidos:", allowedRoles);
        
        // Verificar si el usuario tiene alguno de los roles permitidos para la ruta
        const userHasAllowedRole = userRoles?.some(userRole => 
          allowedRoles.includes(userRole.role)
        );

        if (!userHasAllowedRole) {
          console.log("RouteGuard: Usuario no tiene roles permitidos para esta ruta");
          
          // Determinar a qué dashboard redirigir según la jerarquía de roles
          let targetPath = "/performance/review"; // Ruta por defecto
          
          if (userRolesList.includes('hr_manager')) {
            targetPath = '/hr/dashboard';
          } else if (userRolesList.includes('supervisor')) {
            targetPath = '/supervisor/dashboard';
          }
          
          // Si ya estamos en la ruta correcta para el rol, no redirigir
          if (location.pathname === targetPath) {
            console.log("RouteGuard: Ya estamos en la ruta correcta:", targetPath);
            setIsAuthorized(true);
            return;
          }
          
          // Evitar redirigir si ya se intentó una redirección o si estamos en una ruta de autenticación
          if (!redirectAttempted && !location.pathname.startsWith('/auth/')) {
            redirectAttempted = true;
            console.log("RouteGuard: Redirigiendo a:", targetPath);
            toast({
              description: "Redirigiendo al dashboard correspondiente a tu rol"
            });
            navigate(targetPath, { replace: true });
          }
          return;
        }
        
        console.log("RouteGuard: Usuario autorizado para la ruta actual");
        setIsAuthorized(true);
      } catch (error) {
        console.error("Error en RouteGuard:", error);
        setIsAuthorized(false);
        if (!redirectAttempted && !location.pathname.startsWith('/auth/')) {
          redirectAttempted = true;
          navigate('/auth/login', { replace: true });
        }
      }
    };

    checkAuth();
  }, [navigate, allowedRoles, location.pathname, toast]);

  // Mostrar spinner o mensaje de carga mientras se verifica la autorización
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verificando acceso...</div>
      </div>
    );
  }

  return <>{children}</>;
};
