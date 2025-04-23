
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsContainer } from "./components/reports/ReportsContainer";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function ReportsFullPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="border-2 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/50">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Reportes de Evaluación de Desempeño</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generación y exportación de reportes del personal
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/hr/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="lg:mx-auto lg:max-w-4xl">
          <ReportsContainer />
        </CardContent>
      </Card>
    </div>
  );
}
