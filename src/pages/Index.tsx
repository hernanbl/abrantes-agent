
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, ClipboardList, Users } from "lucide-react";
import { StatusBadge } from "./supervisor/components/StatusBadge";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface ReviewStatus {
  id: string;
  status: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isHrManager, setIsHrManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/login');
        return;
      }

      // Obtener datos del perfil del usuario
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setUserName(`${profileData.first_name} ${profileData.last_name}`);
      } else {
        setUserName(session.user.email || "Empleado");
      }

      // Verificar roles del usuario
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (userRolesData && userRolesData.length > 0) {
        const roles = userRolesData.map(ur => ur.role);
        setUserRoles(roles);
        setIsSupervisor(roles.includes('supervisor'));
        setIsHrManager(roles.includes('hr_manager'));
      }

      // Obtener estado de la revisión
      const { data: reviewData } = await supabase
        .from('performance_reviews')
        .select('status')
        .eq('employee_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (reviewData) {
        setReviewStatus(reviewData.status);
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Definir función de logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  // Mostrar links a diferentes secciones según los roles del usuario
  const renderRoleLinks = () => {
    return (
      <div className="grid gap-6 mt-8">
        {isHrManager && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Users className="mr-2 h-5 w-5" />
                Panel de Recursos Humanos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Accede al panel de administración de recursos humanos.
              </p>
              <Button onClick={() => navigate('/hr/dashboard')}>
                Ir al panel
              </Button>
            </CardContent>
          </Card>
        )}
        
        {isSupervisor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Panel de Supervisor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Accede al panel de supervisión de empleados.
              </p>
              <Button onClick={() => navigate('/supervisor/dashboard')}>
                Ir al panel
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* TODOS los usuarios deben ver esta sección, independiente de sus roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              Mi Evaluación de Desempeño
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Complete su evaluación de desempeño para el período actual.
            </p>
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/performance/review')}>
                Ir al formulario
              </Button>
              {reviewStatus && (
                <div>
                  Estado: <StatusBadge status={reviewStatus} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Sistema de Evaluación de Desempeño</h1>
          <p className="mt-2">
            Hola <span>{userName}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Roles: {userRoles.map(role => {
              switch(role) {
                case 'hr_manager': return 'Gerente de RRHH';
                case 'supervisor': return 'Supervisor';
                case 'employee': return 'Empleado';
                default: return role;
              }
            }).join(', ')}
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>

      {renderRoleLinks()}
    </div>
  );
};

export default Index;
