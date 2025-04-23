
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "../types";

export const useCompanies = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name');
      
      if (error) {
        console.error("Error fetching companies:", error);
        toast({
          variant: "destructive",
          title: "Error al cargar empresas",
          description: error.message,
        });
        return;
      }

      if (data) {
        setCompanies(data);
      }
      setIsLoading(false);
    };

    fetchCompanies();
  }, [toast]);

  return { companies, isLoading };
};
