
import { ReportsContainer } from "./reports/ReportsContainer";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ReportsSection() {
  return (
    <Card className="shadow-md overflow-hidden">
      <CardHeader className="pb-3 bg-[#d3f8fa] rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Reportes y Estadísticas</CardTitle>
          </div>
          <Button variant="default" size="sm" asChild>
            <Link to="/hr/reports">
              <FileText className="mr-2 h-4 w-4" />
              Ver todos los reportes
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <ReportsContainer />
      </CardContent>
    </Card>
  );
}
