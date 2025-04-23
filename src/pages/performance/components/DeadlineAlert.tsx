
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, AlertCircle } from "lucide-react";

interface DeadlineAlertProps {
  isExpired: boolean;
  daysRemaining: number;
  formattedDeadline: string;
  isSupervisor: boolean;
  isHrManager: boolean;
  loading: boolean;
}

export function DeadlineAlert({ 
  isExpired, 
  daysRemaining, 
  formattedDeadline,
  isSupervisor,
  isHrManager,
  loading
}: DeadlineAlertProps) {
  if (loading || isSupervisor || isHrManager) return null;
  
  if (isExpired) {
    return (
      <Alert variant="destructive" className="mb-4 border-2 border-destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">Plazo expirado</AlertTitle>
        <AlertDescription className="text-base">
          El período para completar la evaluación ha finalizado. 
          La información solo está disponible en modo lectura.
          Comuníquese con su supervisor o RRHH si necesita más información.
        </AlertDescription>
      </Alert>
    );
  } else if (daysRemaining <= 7) {
    const isUrgent = daysRemaining <= 3;
    
    return (
      <Alert 
        variant={isUrgent ? "destructive" : "default"} 
        className={`mb-4 ${isUrgent ? 'border-2 border-destructive animate-pulse' : ''}`}
      >
        {isUrgent ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        <AlertTitle className={`${isUrgent ? 'text-lg font-bold' : 'font-medium'}`}>
          {isUrgent ? '¡Atención! Tiempo limitado' : 'Tiempo limitado'}
        </AlertTitle>
        <AlertDescription className={isUrgent ? 'text-base' : ''}>
          Quedan <strong>{daysRemaining} día{daysRemaining !== 1 ? 's' : ''}</strong> para completar la evaluación.
          Fecha límite: <strong>{formattedDeadline}</strong>.
          {isUrgent && <p className="mt-1 font-semibold">Es obligatorio completar todos los campos antes de la fecha límite.</p>}
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
