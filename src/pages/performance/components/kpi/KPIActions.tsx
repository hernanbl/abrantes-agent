import { Button } from "@/components/ui/button";
import { Plus, UserCircle } from "lucide-react";

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
          className="mt-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          <UserCircle className="h-4 w-4 mr-1" />
          Agregar nuevo KPI
        </Button>
      )}
    </div>
  );
}
