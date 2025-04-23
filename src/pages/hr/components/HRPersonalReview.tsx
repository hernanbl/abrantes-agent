
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ReviewData, SupervisorData } from "../hooks/types/hrTypes";
import { StatusBadge } from "@/pages/supervisor/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HRPersonalReviewProps {
  review: ReviewData | null;
  supervisorData?: SupervisorData | null;
}

export function HRPersonalReview({ review, supervisorData }: HRPersonalReviewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to verify and fix the supervisor relationship
  useEffect(() => {
    const checkAndFixSupervisorRelationship = async () => {
      try {
        if (supervisorData) {
          // If we already have supervisor data, no need to fix anything
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // Get the HR Manager's ID (Mariana Gentili) - we'll use the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("No se pudo obtener información del usuario actual");
          return;
        }
        
        const hrManagerId = user.id;
        
        // Try to find supervisor by their role and data
        const { data: supervisors, error: supError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'supervisor');
        
        if (supError) {
          console.error("Error al buscar supervisores:", supError);
          setError("No se pudieron encontrar supervisores en la base de datos");
          return;
        }
        
        // Get all supervisor profiles
        const supervisorIds = supervisors.map(s => s.user_id);
        
        if (supervisorIds.length === 0) {
          console.error("No se encontraron supervisores");
          setError("No se encontraron supervisores en la base de datos");
          return;
        }
        
        // Find Fernando Otero in the profiles of supervisors
        const { data: supervisorProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', supervisorIds);
          
        if (profilesError) {
          console.error("Error al obtener perfiles de supervisores:", profilesError);
          setError("No se pudieron obtener los perfiles de supervisores");
          return;
        }
        
        const fernandoOtero = supervisorProfiles.find(
          s => s.first_name.includes('Fernando') && 
               s.last_name.includes('Otero')
        );
        
        if (!fernandoOtero) {
          console.error("No se encontró a Fernando Otero");
          setError("No se pudo encontrar al Supervisor en la base de datos");
          return;
        }
        
        const supervisorId = fernandoOtero.id;
        console.log("Supervisor encontrado:", supervisorId);
        
        // Check if relationship already exists
        const { data: existingRelation, error: relError } = await supabase
          .from('supervisor_employees')
          .select('*')
          .eq('supervisor_id', supervisorId)
          .eq('employee_id', hrManagerId)
          .maybeSingle();
        
        if (relError) {
          console.error("Error al verificar relación:", relError);
          setError("Error al verificar relación supervisor-empleado");
          return;
        }
        
        // If no relationship exists, create it
        if (!existingRelation) {
          const { error: insertError } = await supabase
            .from('supervisor_employees')
            .insert({
              supervisor_id: supervisorId,
              employee_id: hrManagerId
            });
          
          if (insertError) {
            console.error("Error al crear relación:", insertError);
            setError("No se pudo establecer la relación supervisor-empleado");
            return;
          }
          
          toast({
            title: "Relación actualizada",
            description: "Fernando Otero ahora supervisa a Mariana Gentili",
          });
          
          // Reload the page to see changes
          window.location.reload();
        }
      } catch (error: any) {
        console.error("Error general:", error);
        setError("Ocurrió un error al procesar la solicitud");
      } finally {
        setLoading(false);
      }
    };
    
    // Execute only if we don't have supervisorData and not loading
    if (!supervisorData && !loading) {
      checkAndFixSupervisorRelationship();
    }
  }, [supervisorData, toast, loading]);

  // If no review, show info card without button
  if (!review) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tu Evaluación de Desempeño</CardTitle>
          <CardDescription>
            No hay una evaluación de desempeño registrada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Estado:</p>
              <StatusBadge status="pendiente" />
            </div>
            
            {supervisorData && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Supervisor:</p>
                <span className="text-sm">{supervisorData.first_name} {supervisorData.last_name}</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center text-red-500 text-sm gap-2 mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Evaluación de Desempeño</CardTitle>
        <CardDescription>
          Revisión del período actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Posición:</p>
            <span className="text-sm">{review.current_position}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Departamento:</p>
            <span className="text-sm">{review.department || "No especificado"}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Estado:</p>
            <StatusBadge status={review.status} />
          </div>
          
          {supervisorData && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Supervisor:</p>
              <span className="text-sm">{supervisorData.first_name} {supervisorData.last_name}</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center text-red-500 text-sm gap-2 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
