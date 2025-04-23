
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupervisorReviewSection } from "./components/SupervisorReviewSection";
import { EmployeesList } from "./components/EmployeesList";
import { LoadingCard } from "./components/LoadingCard";
import { useSupervisorData } from "./hooks/useSupervisorData";
import { StatusBadge } from "./components/StatusBadge";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function SupervisorView() {
  const { employees, supervisorName, supervisorId, loading, supervisorReview, loadSupervisedEmployees } = useSupervisorData();
  const { toast } = useToast();
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    if (!loading && employees.length > 0) {
      toast({
        title: "Empleados cargados",
        description: `Se han cargado ${employees.length} empleados asignados.`,
      });
    }
  }, [loading, employees, toast]);

  const handleReload = async () => {
    setIsReloading(true);
    toast({
      title: "Actualizando datos",
      description: "Recargando información de empleados..."
    });
    
    await loadSupervisedEmployees(supervisorId);
    
    setIsReloading(false);
    toast({
      title: "Datos actualizados",
      description: "La información ha sido actualizada correctamente"
    });
  };

  if (loading || isReloading) {
    return <LoadingCard />;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Panel del Supervisor</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {supervisorName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReload}
              className="flex items-center gap-2"
              disabled={isReloading}
            >
              <RefreshCw className={`h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
              Actualizar datos
            </Button>
            <ProfileMenu userName={supervisorName} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {employees.length === 0 ? (
              <div className="text-center p-8 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">No hay empleados asignados a tu supervisión</p>
              </div>
            ) : (
              <EmployeesList 
                employees={employees} 
              />
            )}
            
            <SupervisorReviewSection 
              review={supervisorReview} 
              getStatusBadge={(status) => <StatusBadge status={status} />}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
