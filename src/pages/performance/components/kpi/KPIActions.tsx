import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface KPIActionsProps {
  canEditKpis?: boolean;
  onAddKpi?: () => void;
  canAddKpi?: boolean;
  isCurrentUserTheEmployee?: boolean;
}

export function KPIActions({ 
  canEditKpis = false, 
  onAddKpi,
  canAddKpi = false,
  isCurrentUserTheEmployee = false
}: KPIActionsProps) {
  return (
    <div className="flex justify-between">
      {canAddKpi && (
        <Button
          type="button"
          onClick={() => onAddKpi && onAddKpi()}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar nuevo KPI
        </Button>
      )}
    </div>
  );
}
