
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DevelopmentGoalsProps {
  goals: string[];
  onGoalsChange: (goals: string[]) => void;
  readOnly?: boolean;
  showValidationErrors?: boolean;
  reviewId?: string; // Add reviewId prop to enable direct saving
}

export function DevelopmentGoals({ 
  goals, 
  onGoalsChange, 
  readOnly = false, 
  showValidationErrors = false,
  reviewId
}: DevelopmentGoalsProps) {
  const [newGoal, setNewGoal] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Mostrar información detallada para depuración
  console.log("DevelopmentGoals component rendering:", {
    readOnly,
    goalsLength: goals.length,
    hasNewGoalValue: newGoal.length > 0,
    hasReviewId: !!reviewId
  });

  useEffect(() => {
    // Confirmar en la consola cuando el componente se renderiza con cambio de props
    console.log("DevelopmentGoals se ha renderizado con readOnly:", readOnly);
  }, [readOnly, goals.length]);

  const saveGoalToDatabase = async (goalDescription: string) => {
    if (!reviewId) {
      console.error("No hay ID de revisión para guardar la meta");
      return false;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('development_goals')
        .insert({
          review_id: reviewId,
          description: goalDescription
        });

      if (error) {
        console.error("Error al guardar meta en Supabase:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la meta de desarrollo"
        });
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error inesperado al guardar meta:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGoalFromDatabase = async (goalToDelete: string) => {
    if (!reviewId) {
      console.error("No hay ID de revisión para eliminar la meta");
      return false;
    }

    setIsSaving(true);
    try {
      // Buscar y eliminar la meta por descripción y review_id
      const { error } = await supabase
        .from('development_goals')
        .delete()
        .match({ 
          review_id: reviewId,
          description: goalToDelete
        });

      if (error) {
        console.error("Error al eliminar meta de Supabase:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la meta de desarrollo"
        });
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error inesperado al eliminar meta:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGoal = async () => {
    if (newGoal.trim()) {
      const goalText = newGoal.trim();
      
      // Si tenemos reviewId, guardar directamente en la base de datos
      if (reviewId) {
        const success = await saveGoalToDatabase(goalText);
        if (success) {
          // Actualizar el estado local solo si se guardó correctamente
          const updatedGoals = [...goals, goalText];
          onGoalsChange(updatedGoals);
          setNewGoal("");
          
          // Mostrar notificación de éxito
          toast({
            title: "Meta agregada",
            description: "La meta de desarrollo ha sido agregada y guardada exitosamente"
          });
        }
      } else {
        // Comportamiento original sin guardado en DB
        const updatedGoals = [...goals, goalText];
        onGoalsChange(updatedGoals);
        setNewGoal("");
        
        toast({
          title: "Meta agregada",
          description: "La meta de desarrollo ha sido agregada exitosamente"
        });
      }
    }
  };

  const handleRemoveGoal = async (index: number) => {
    const goalToDelete = goals[index];
    
    // Si tenemos reviewId, eliminar de la base de datos
    if (reviewId) {
      const success = await deleteGoalFromDatabase(goalToDelete);
      if (success) {
        // Actualizar el estado local solo si se eliminó correctamente de la BD
        const updatedGoals = goals.filter((_, i) => i !== index);
        onGoalsChange(updatedGoals);
        
        // Mostrar notificación de eliminación
        toast({
          title: "Meta eliminada",
          description: "La meta de desarrollo ha sido eliminada exitosamente"
        });
      }
    } else {
      // Comportamiento original sin eliminación en DB
      const updatedGoals = goals.filter((_, i) => i !== index);
      onGoalsChange(updatedGoals);
      
      toast({
        title: "Meta eliminada",
        description: "La meta de desarrollo ha sido eliminada exitosamente"
      });
    }
  };

  const isInvalid = showValidationErrors && goals.length === 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Metas de Desarrollo</h3>
      <p className="text-sm text-muted-foreground">
        Define acciones concretas para mejorar tus competencias
      </p>

      {isInvalid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Debe definir al menos una meta de desarrollo.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {goals.length > 0 ? (
          goals.map((goal, index) => (
            <div key={index} className="flex items-center gap-2 p-4 border rounded-lg">
              <p className="flex-1">{goal}</p>
              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveGoal(index)}
                  disabled={isSaving}
                >
                  Eliminar
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 border rounded-lg text-muted-foreground">
            No hay metas de desarrollo definidas
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="newGoal" className="sr-only">
              Nueva meta de desarrollo
            </Label>
            <Input
              id="newGoal"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Describe una nueva meta de desarrollo"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddGoal();
                }
              }}
            />
          </div>
          <Button 
            type="button" 
            onClick={handleAddGoal}
            disabled={isSaving || !newGoal.trim()}
          >
            {isSaving ? "Guardando..." : "Agregar"}
          </Button>
        </div>
      )}
    </div>
  );
}
