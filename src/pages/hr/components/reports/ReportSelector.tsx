
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface ReportSelectorProps {
  reportType: string;
  setReportType: (type: string) => void;
}

export function ReportSelector({ reportType, setReportType }: ReportSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">Tipo de Reporte</span>
      </div>
      <Select value={reportType} onValueChange={setReportType}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar tipo de reporte" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las evaluaciones</SelectItem>
          <SelectItem value="pending">Evaluaciones pendientes</SelectItem>
          <SelectItem value="completed">Evaluaciones enviadas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
