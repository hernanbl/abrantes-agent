
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Supervisor {
  id: string;
  fullName: string;
}

export const useSupervisors = () => {
  const { toast } = useToast();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSupervisors() {
      try {
        setLoading(true);
        
        // Obtener usuarios con rol de supervisor O rol de hr_manager
        const { data: userRolesData, error: userRolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['supervisor', 'hr_manager']);
          
        if (userRolesError) throw userRolesError;
        
        if (!userRolesData || userRolesData.length === 0) {
          setSupervisors([]);
          return;
        }
        
        // Obtener perfiles de los supervisores y hr_managers
        const supervisorIds = userRolesData.map(ur => ur.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', supervisorIds);
          
        if (profilesError) throw profilesError;
        
        // Formatear los datos para el select, sin duplicados
        const formattedSupervisors = profilesData.map(profile => ({
          id: profile.id,
          fullName: `${profile.first_name} ${profile.last_name}`
        }));
        
        // Eliminar duplicados (si un usuario tiene ambos roles)
        const uniqueSupervisors = Array.from(
          new Map(formattedSupervisors.map(s => [s.id, s])).values()
        );
        
        setSupervisors(uniqueSupervisors);
      } catch (error: any) {
        console.error('Error al obtener supervisores:', error);
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los supervisores",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchSupervisors();
  }, [toast]);

  return { supervisors, loading, error };
};
