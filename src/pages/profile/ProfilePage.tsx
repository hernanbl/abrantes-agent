
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProfileMenu } from "@/components/ProfileMenu";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  role?: string;
  current_position?: string;
  department?: string;
  created_at?: string;
  supervisor_name?: string;
  profile_image?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth/login');
        return;
      }
      
      const userId = session.user.id;
      const userEmail = session.user.email;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, company_id, created_at')
          .eq('id', userId)
          .single();
          
        if (profileError) throw profileError;
        
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
          
        if (roleError && roleError.code !== 'PGRST116') throw roleError;
        
        let companyName = null;
        if (profileData.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('name')
            .eq('id', profileData.company_id)
            .single();
            
          if (!companyError) {
            companyName = companyData.name;
          }
        }
        
        const { data: reviewData, error: reviewError } = await supabase
          .from('performance_reviews')
          .select('current_position, department')
          .eq('employee_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        let supervisorName = null;
        const { data: supervisorRelation, error: supervisorRelationError } = await supabase
          .from('supervisor_employees')
          .select('supervisor_id')
          .eq('employee_id', userId)
          .single();
          
        if (!supervisorRelationError && supervisorRelation?.supervisor_id) {
          const { data: supervisorData, error: supervisorError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', supervisorRelation.supervisor_id)
            .single();
            
          if (!supervisorError) {
            supervisorName = `${supervisorData.first_name} ${supervisorData.last_name}`;
          }
        }
        
        let profileImage = null;
        
        console.log("Current user ID:", userId);
        
        profileImage = "/lovable-uploads/e0eb81da-aa66-40b6-800e-69b89aa1c96f.png";
        console.log("Profile image path set to:", profileImage);
        
        setProfile({
          id: profileData.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: userEmail || '',
          company_name: companyName || 'No asignada',
          role: roleData?.role || 'No asignado',
          current_position: reviewData?.current_position || 'No asignada',
          department: reviewData?.department || 'No asignado',
          created_at: profileData.created_at,
          supervisor_name: supervisorName || 'No asignado',
          profile_image: profileImage,
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Cargando perfil...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  console.log("Profile data:", profile);
  console.log("Profile image URL:", profile?.profile_image);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            {profile?.profile_image ? (
              <div className="relative">
                <img 
                  src={profile.profile_image} 
                  alt={`${profile.first_name} ${profile.last_name}`} 
                  className="h-16 w-16 rounded-full object-cover shadow-[0_0_15px_rgba(117,134,150,0.3)]" 
                />
              </div>
            ) : (
              <Avatar className="h-16 w-16">
                <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
              </Avatar>
            )}
            <CardTitle className="ml-2">Mi Perfil</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Información Personal</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                    <p>{profile.first_name} {profile.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
                    <p>{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rol</p>
                    <p>{profile.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                    <p>{new Date(profile.created_at || '').toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Información Laboral</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                    <p>{profile.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cargo Actual</p>
                    <p>{profile.current_position}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Departamento</p>
                    <p>{profile.department}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Supervisor</p>
                    <p>{profile.supervisor_name}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>No se pudo cargar la información del perfil.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
