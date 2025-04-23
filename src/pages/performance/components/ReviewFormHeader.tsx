
import { CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "../../supervisor/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface ReviewFormHeaderProps {
  children?: React.ReactNode;
}

export function ReviewFormHeader({ children }: ReviewFormHeaderProps) {
  const navigate = useNavigate();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchUserRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
          
        if (roles) {
          setUserRoles(roles.map(r => r.role));
        }
      }
    };
    
    fetchUserRoles();
  }, []);
  
  const handleDashboardClick = () => {
    if (userRoles.includes('hr_manager')) {
      navigate('/hr/dashboard');
    } else if (userRoles.includes('supervisor')) {
      navigate('/supervisor/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <CardHeader className="pb-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col space-y-2">
          <CardTitle>Evaluación de Desempeño</CardTitle>
          {children}
        </div>
        <Button 
          variant="outline" 
          onClick={handleDashboardClick}
          className="flex items-center gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </CardHeader>
  );
}
