
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Login: Intentando iniciar sesión con:", formData.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Login: Error de autenticación:', error);
        throw error;
      }

      console.log('Login: Autenticación exitosa, session:', data.session ? 'present' : 'null');
      
      if (data.session) {
        // Obtener roles del usuario para saber a dónde redirigir
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.session.user.id);
          
        if (rolesError) {
          console.error('Login: Error al obtener roles:', rolesError);
        }
        
        console.log('Login: Roles del usuario:', userRoles);
        
        // Determinar la ruta de destino según los roles
        let targetPath = "/performance/review"; // Ruta por defecto
        
        if (userRoles && userRoles.length > 0) {
          const rolesList = userRoles.map(r => r.role);
          
          // HR Manager tiene la mayor prioridad
          if (rolesList.includes('hr_manager')) {
            targetPath = "/hr/dashboard";
            
            toast({
              title: "Bienvenido",
              description: "Iniciando sesión como Gerente de RRHH",
            });
          } 
          // Supervisor es el siguiente en la jerarquía
          else if (rolesList.includes('supervisor')) {
            targetPath = "/supervisor/dashboard";
            
            toast({
              title: "Bienvenido",
              description: "Iniciando sesión como Supervisor",
            });
          }
        }
        
        console.log('Login: Redirigiendo a:', targetPath);
        // Usar replace: true para reemplazar la ruta actual en el historial
        navigate(targetPath, { replace: true });
      } else {
        toast({
          title: "Verificando credenciales",
          description: "Por favor espere...",
        });
      }

    } catch (error: any) {
      console.error('Login: Error en login:', error);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "Credenciales inválidas. Por favor, verifica tu email y contraseña.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="juan.perez@empresa.com"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          "Iniciando sesión..."
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión
          </>
        )}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => navigate("/auth/register")}
        >
          Registrarme
        </Button>
      </p>
    </form>
  );
};
