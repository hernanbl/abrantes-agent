
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { ReportSelector } from "./ReportSelector";
import { ReportActions } from "./ReportActions";
import { ReportTable } from "./ReportTable";
import { fetchReportData, exportToCSV } from "./ReportService";
import { ReviewReport } from "./types";
import { toast } from "sonner";

export function ReportsContainer() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<string>("all");
  const [reportData, setReportData] = useState<ReviewReport[]>([]);
  const [showReport, setShowReport] = useState(false);

  // Function to generate the evaluation report
  const generateReport = async () => {
    try {
      setLoading(true);
      const data = await fetchReportData(reportType);
      setReportData(data);
      setShowReport(true);
      toast.success("Reporte generado con éxito");
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      toast.error("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  // Function to export to Excel (CSV)
  const exportToExcel = () => {
    if (reportData.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    exportToCSV(reportData);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Reportes</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <ReportSelector 
            reportType={reportType} 
            setReportType={setReportType} 
          />
          
          <ReportActions
            generateReport={generateReport}
            exportToExcel={exportToExcel}
            loading={loading}
            reportData={reportData}
          />
        </div>

        <ReportTable 
          reportData={reportData} 
          showReport={showReport} 
        />
      </div>
    </Card>
  );
}
