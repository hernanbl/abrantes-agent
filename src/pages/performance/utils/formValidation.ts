
import { useToast } from "@/hooks/use-toast";

type Skill = {
  name: string;
  level: "bajo" | "medio" | "alto";
};

type KPI = {
  description: string;
  deadline: string;
  weight: number;
  completion_percentage?: number;
};

interface FormData {
  current_position: string;
  department: string;
  position_start_date: string;
  employee_comment: string;
  supervisor_comment: string;
  long_term_goal: string;
}

export const validateForm = (
  formData: FormData,
  kpis: KPI[],
  goals: string[],
  toast: ReturnType<typeof useToast>['toast']
): boolean => {
  // Verificar que los KPIs estén completos
  const kpisValid = kpis.every(kpi => 
    kpi.description && kpi.description.trim() !== '' && 
    kpi.deadline && 
    kpi.weight > 0
  );
  
  if (!kpisValid) {
    toast({
      variant: "destructive",
      title: "KPIs incompletos",
      description: "Todos los KPIs deben tener descripción, fecha límite y peso."
    });
    return false;
  }
  
  // Verificar que el peso total sea 100%
  const totalWeight = kpis.reduce((sum, kpi) => sum + Number(kpi.weight || 0), 0);
  if (totalWeight !== 100) {
    toast({
      variant: "destructive",
      title: "Peso de KPIs incorrecto",
      description: `El peso total de los KPIs debe ser 100%. Actualmente es ${totalWeight}%.`
    });
    return false;
  }
  
  // Validar que haya al menos una meta de desarrollo
  if (goals.length === 0 || goals.every(goal => !goal || goal.trim() === '')) {
    toast({
      variant: "destructive",
      title: "Metas de desarrollo incompletas",
      description: "Debe definir al menos una meta de desarrollo."
    });
    return false;
  }
  
  // Validar información personal
  if (!formData.department || !formData.current_position || !formData.position_start_date) {
    toast({
      variant: "destructive",
      title: "Información personal incompleta",
      description: "Todos los campos de Información Personal son obligatorios."
    });
    return false;
  }
  
  // Validar comentarios del empleado
  if (!formData.employee_comment || formData.employee_comment.trim() === '') {
    toast({
      variant: "destructive",
      title: "Comentarios incompletos",
      description: "Debe incluir sus comentarios como empleado."
    });
    return false;
  }
  
  // Validar objetivo a largo plazo
  if (!formData.long_term_goal || formData.long_term_goal.trim() === '') {
    toast({
      variant: "destructive",
      title: "Objetivo a largo plazo incompleto",
      description: "Debe definir su objetivo profesional a largo plazo."
    });
    return false;
  }

  return true;
};

// Exportando la función que se llama en reviewDataService.ts
export const validateFormForSubmission = validateForm;
