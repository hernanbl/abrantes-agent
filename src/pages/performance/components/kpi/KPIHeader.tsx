import { AlertCircle, UserCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface KPIHeaderProps { 
  isCurrentUserTheEmployee?: boolean;
  hasKpisError?: boolean;
  canEditKpis?: boolean;
  isReadOnly?: boolean;
  hasError?: boolean;
  isSubmitted?: boolean;
}

export function KPIHeader({ 
  isCurrentUserTheEmployee = false, 
  hasKpisError = false, 
  canEditKpis = false,
  isReadOnly = false,
  hasError = false,
  isSubmitted = false
}: KPIHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Indicadores Clave de Desempeño (KPIs)
        </h3>
        {canEditKpis && (
          <div className="flex items-center gap-1 text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            <UserCircle className="h-4 w-4" />
            <span>Campo del empleado</span>
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        {isCurrentUserTheEmployee 
          ? "Define tus KPIs para este período, en acuerdo con tu supervisor."
          : "Los KPIs son definidos por el empleado, acordados con su supervisor, y reflejan los objetivos a cumplir."}
      </p>
      
      {(hasKpisError || hasError) && canEditKpis && !isSubmitted && !isReadOnly && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Todos los KPIs deben tener descripción y peso.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
