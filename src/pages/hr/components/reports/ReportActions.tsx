
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { ReviewReport } from "./types";

interface ReportActionsProps {
  generateReport: () => Promise<void>;
  exportToExcel: () => void;
  loading: boolean;
  reportData: ReviewReport[];
}

export function ReportActions({ 
  generateReport, 
  exportToExcel, 
  loading, 
  reportData 
}: ReportActionsProps) {
  const handleExport = () => {
    if (reportData.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    exportToExcel();
  };
  
  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={generateReport}
        disabled={loading}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        {loading ? "Generando..." : "Generar Reporte de Evaluaciones"}
      </Button>
      
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={handleExport}
        disabled={loading || reportData.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar a Excel
      </Button>
    </>
  );
}
