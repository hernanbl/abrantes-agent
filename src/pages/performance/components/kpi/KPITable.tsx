import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

interface KPI {
  description: string;
  deadline: string;
  weight: number;
  completion_percentage?: number;
  supervisor_rating?: number;
  id?: string;
}

interface KPITableProps {
  kpis: KPI[];
  handleKpiChange: (index: number, field: keyof KPI, value: string | number) => void;
  canEditKpis: boolean;
  canEditRatings: boolean;
  onSaveRatings?: () => void;
  hasRatingError: boolean;
  isCurrentUserTheEmployee?: boolean;
}

export function KPITable({ 
  kpis, 
  handleKpiChange, 
  canEditKpis, 
  canEditRatings,
  hasRatingError,
  isCurrentUserTheEmployee = false
}: KPITableProps) {
  const { toast } = useToast();
  const [localKpis, setLocalKpis] = useState<KPI[]>([]);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  
  // Sincronizar los KPIs locales cuando cambian los props
  useEffect(() => {
    if (kpis && kpis.length > 0) {
      // Hacer una copia profunda para evitar problemas de referencia
      setLocalKpis(JSON.parse(JSON.stringify(kpis)));
    }
  }, [kpis]);

  // Log para depuración
  console.log("KPITable rendering with KPIs:", localKpis);
  console.log("Permisos de edición:", { canEditKpis, canEditRatings, isCurrentUserTheEmployee });

  // Verificar si hay KPIs válidos
  const hasValidKpis = localKpis && localKpis.length > 0;

  // Función que maneja cambios en las calificaciones y guarda directamente en Supabase
  const handleRatingChange = (index: number, value: string) => {
    // Validar permisos
    if (!canEditRatings || isCurrentUserTheEmployee) {
      console.log("No tiene permisos para editar calificaciones");
      return;
    }
    
    // Obtener el KPI que se está modificando
    const kpi = localKpis[index];
    if (!kpi || !kpi.id) {
      console.error("KPI inválido o sin ID");
      return;
    }
    
    // Convertir el valor a número y validar
    const numValue = parseFloat(value) || 0;
    const boundedValue = Math.min(Math.max(numValue, 0), 10);
    
    console.log(`Actualizando calificación para KPI ${kpi.id}:`, {
      valorAnterior: kpi.supervisor_rating,
      nuevoValor: boundedValue
    });
    
    // Actualizar el estado local inmediatamente para mejor UX
    setLocalKpis(prevKpis => {
      const newKpis = [...prevKpis];
      newKpis[index] = { ...newKpis[index], supervisor_rating: boundedValue };
      return newKpis;
    });
    
    // También actualizar el estado en el componente padre
    handleKpiChange(index, "supervisor_rating", boundedValue);
  };
  
  // Guardar el valor en Supabase al perder el foco
  const handleRatingBlur = async (index: number) => {
    if (!canEditRatings || isCurrentUserTheEmployee) return;
    
    const kpi = localKpis[index];
    if (!kpi || !kpi.id) return;
    
    // Marcar como guardando
    setSavingStates(prev => ({ ...prev, [kpi.id!]: true }));
    
    try {
      console.log(`Guardando KPI ${kpi.id} con calificación:`, kpi.supervisor_rating);
      
      const { data, error } = await supabase
        .from('performance_kpis')
        .update({ supervisor_rating: kpi.supervisor_rating })
        .eq('id', kpi.id)
        .select();
      
      if (error) {
        console.error(`Error al guardar calificación para KPI ${kpi.id}:`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la calificación"
        });
      } else {
        console.log(`KPI ${kpi.id} guardado exitosamente:`, data);
        sonnerToast.success("Calificación guardada", {
          description: "El valor ha sido guardado automáticamente"
        });
      }
    } catch (error) {
      console.error(`Error inesperado al guardar KPI ${kpi.id}:`, error);
    } finally {
      // Desmarcar como guardando
      setSavingStates(prev => ({ ...prev, [kpi.id!]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">Descripción</TableHead>
            <TableHead className="w-[40%]">Puntuación (0-10)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasValidKpis ? (
            localKpis.map((kpi, index) => (
              <TableRow key={kpi.id || index}>
                <TableCell>
                  <Textarea
                    id={`kpi-${index}-description`}
                    value={kpi.description || ""}
                    onChange={(e) => handleKpiChange(index, "description", e.target.value)}
                    placeholder="Describe el KPI"
                    readOnly={!canEditKpis}
                    className={cn(
                      !canEditKpis ? "bg-muted" : "",
                      "min-h-[80px] resize-y"
                    )}
                    required={canEditKpis}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <Input
                        id={`kpi-${index}-rating`}
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={kpi.supervisor_rating !== undefined ? kpi.supervisor_rating : 0}
                        onChange={(e) => handleRatingChange(index, e.target.value)}
                        onBlur={() => handleRatingBlur(index)}
                        className={cn(
                          "w-20", 
                          !canEditRatings || isCurrentUserTheEmployee ? "bg-muted" : "",
                          savingStates[kpi.id!] ? "opacity-50" : ""
                        )}
                        readOnly={!canEditRatings || isCurrentUserTheEmployee}
                      />
                      <span className="text-sm text-muted-foreground">/ 10</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-4">
                No hay KPIs disponibles para este empleado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
