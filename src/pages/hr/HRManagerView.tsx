
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsSection } from "./components/ReportsSection";
import { OrganizationTree } from "./components/OrganizationTree";
import { HRPersonalReview } from "./components/HRPersonalReview";
import { useHRManagerData } from "./hooks/useHRManagerData";
import { ProfileMenu } from "@/components/ProfileMenu";
import { StatusPieChart } from "./components/StatusPieChart";
import { SupervisorRatingsPieChart } from "./components/SupervisorRatingsPieChart";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function HRManagerView() {
  const { 
    hrManagerName, 
    hrManagerReview, 
    organizationData, 
    loading, 
    supervisorFullData,
    reloadData 
  } = useHRManagerData();
  
  const { toast } = useToast();
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    setIsReloading(true);
    toast({
      title: "Recargando datos",
      description: "La información se está actualizando..."
    });
    
    await reloadData();
    
    setIsReloading(false);
    toast({
      title: "Datos actualizados",
      description: "La información ha sido actualizada correctamente"
    });
  };

  // La imagen de perfil de Mariana (HR Manager)
  const hrManagerProfileImage = "/lovable-uploads/df80aaa7-c603-479b-a079-4ab03d015a81.png";

  if (loading || isReloading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Cargando datos...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-64">
              <p>Cargando información del panel de Recursos Humanos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Panel de Recursos Humanos</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {hrManagerName}
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
            <ProfileMenu 
              userName={hrManagerName} 
              profileImage={hrManagerProfileImage}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Destacamos la sección de reportes con borde especial y mayor visibilidad */}
            <div className="grid grid-cols-1 gap-6">
              <ReportsSection />
            </div>
            
            {organizationData && <OrganizationTree data={organizationData} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatusPieChart />
              <SupervisorRatingsPieChart />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HRPersonalReview review={hrManagerReview} supervisorData={supervisorFullData} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
