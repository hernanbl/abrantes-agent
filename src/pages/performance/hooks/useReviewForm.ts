import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Skill = {
  name: string;
  level: "bajo" | "medio" | "alto";
};

type KPI = {
  description: string;
  deadline: string;
  weight: number;
  completion_percentage?: number;
  supervisor_rating?: number;
  id?: string;
  created_at?: string;
  review_id?: string;
};

interface UseReviewFormProps {
  reviewData: any;
  isReadOnly: boolean;
}

export function useReviewForm({ reviewData, isReadOnly }: UseReviewFormProps) {
  const [userName, setUserName] = useState<string>("");
  const [formData, setFormData] = useState({
    current_position: reviewData?.current_position || '',
    department: reviewData?.department || '',
    position_start_date: reviewData?.position_start_date || '',
    employee_comment: reviewData?.employee_comment || '',
    supervisor_comment: reviewData?.supervisor_comment || '',
    long_term_goal: reviewData?.long_term_goal || '',
  });

  const defaultSkills: Skill[] = [
    { name: "Trabajo en equipo", level: "medio" },
    { name: "Liderazgo", level: "medio" },
    { name: "Comunicación efectiva", level: "medio" },
    { name: "Resolución de problemas", level: "medio" },
  ];

  const [skills, setSkills] = useState<Skill[]>(defaultSkills);
  
  const defaultKpis: KPI[] = [
    { description: '', deadline: new Date().toISOString().split('T')[0], weight: 33, completion_percentage: 0, supervisor_rating: 0 },
    { description: '', deadline: new Date().toISOString().split('T')[0], weight: 33, completion_percentage: 0, supervisor_rating: 0 },
    { description: '', deadline: new Date().toISOString().split('T')[0], weight: 34, completion_percentage: 0, supervisor_rating: 0 },
  ];

  const [kpis, setKpis] = useState<KPI[]>(defaultKpis);
  const [goals, setGoals] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const loadGoalsFromDatabase = async (reviewId: string) => {
    try {
      console.log("Cargando metas directamente de la base de datos para review:", reviewId);
      
      const { data, error } = await supabase
        .from('development_goals')
        .select('description')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error al cargar metas desde Supabase:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const goalsData = data.map(g => g.description);
        console.log("Metas de desarrollo cargadas:", goalsData);
        setGoals(goalsData);
      } else {
        console.log("No se encontraron metas de desarrollo en la base de datos");
        setGoals([]);
      }
    } catch (err) {
      console.error("Error inesperado al cargar metas:", err);
    }
  };

  // Cargar KPIs directamente de la base de datos
  const loadKpisFromDatabase = async (reviewId: string) => {
    try {
      console.log("Cargando KPIs directamente de la base de datos para review:", reviewId);
      
      const { data, error } = await supabase
        .from('performance_kpis')
        .select('*')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error al cargar KPIs desde Supabase:", error);
        return false;
      }
      
      if (data && data.length > 0) {
        console.log("KPIs cargados directamente de la base de datos:", data);
        
        // Verificar si los KPIs tienen descripciones antes de usarlos
        const formattedKpis = data.map(kpi => ({
          id: kpi.id,
          description: kpi.description || '',
          deadline: kpi.deadline || new Date().toISOString().split('T')[0],
          weight: Number(kpi.weight) || 0,
          completion_percentage: kpi.completion_percentage !== null ? kpi.completion_percentage : 0,
          supervisor_rating: kpi.supervisor_rating !== null ? kpi.supervisor_rating : 0,
          created_at: kpi.created_at,
          review_id: kpi.review_id
        }));
        
        console.log("KPIs formateados:", formattedKpis);
        setKpis(formattedKpis);
        return true;
      } else {
        console.log("No se encontraron KPIs en la base de datos, usando los predeterminados");
        return false;
      }
    } catch (err) {
      console.error("Error inesperado al cargar KPIs:", err);
      return false;
    }
  };

  // Cargar competencias directamente de la base de datos
  const loadSkillsFromDatabase = async (reviewId: string) => {
    try {
      console.log("Cargando competencias directamente de la base de datos para review:", reviewId);
      
      const { data, error } = await supabase
        .from('skill_evaluations')
        .select('skill_name, level')
        .eq('review_id', reviewId);
      
      if (error) {
        console.error("Error al cargar competencias desde Supabase:", error);
        return false;
      }
      
      if (data && data.length > 0) {
        console.log("Competencias cargadas directamente de la base de datos:", data);
        
        // Convertir al formato esperado por el componente
        const formattedSkills = data.map(skill => ({
          name: skill.skill_name,
          level: (skill.level as "bajo" | "medio" | "alto") || "medio"
        }));
        
        // Asegurar que todas las competencias predeterminadas estén incluidas
        const skillNames = new Set(formattedSkills.map(s => s.name));
        const mergedSkills: Skill[] = [...formattedSkills];
        
        defaultSkills.forEach(defaultSkill => {
          if (!skillNames.has(defaultSkill.name)) {
            mergedSkills.push(defaultSkill);
          }
        });
        
        console.log("Competencias formateadas y completas:", mergedSkills);
        setSkills(mergedSkills);
        return true;
      } else {
        console.log("No se encontraron competencias en la base de datos, usando las predeterminadas");
        return false;
      }
    } catch (err) {
      console.error("Error inesperado al cargar competencias:", err);
      return false;
    }
  };

  useEffect(() => {
    if (reviewData?.kpis && reviewData.kpis.length > 0) {
      console.log("DEBUGGING KPIs in useReviewForm - raw KPIs:", reviewData.kpis);
      
      // Verificar si los KPIs tienen las propiedades correctas
      const firstKpi = reviewData.kpis[0];
      if (firstKpi) {
        console.log("DEBUGGING KPIs in useReviewForm - First KPI details:", {
          hasDescription: !!firstKpi.description,
          description: firstKpi.description,
          id: firstKpi.id,
          reviewId: firstKpi.review_id
        });
      }
    }
  }, [reviewData]);

  useEffect(() => {
    if (reviewData) {
      console.log("Actualizando formData en useReviewForm:", {
        employee_comment: reviewData.employee_comment || '',
        supervisor_comment: reviewData.supervisor_comment || ''
      });

      setFormData({
        current_position: reviewData.current_position || '',
        department: reviewData.department || '',
        position_start_date: reviewData.position_start_date || '',
        employee_comment: reviewData.employee_comment || '',
        supervisor_comment: reviewData.supervisor_comment || '',
        long_term_goal: reviewData.long_term_goal || '',
      });

      // Prioridad 1: Cargar KPIs directamente de la base de datos si tenemos un ID de revisión
      if (reviewData.id) {
        loadKpisFromDatabase(reviewData.id);
        // Cargar competencias directamente de la base de datos
        loadSkillsFromDatabase(reviewData.id);
      } 
      // Si no tenemos ID pero sí tenemos KPIs en reviewData, los usamos
      else if (reviewData.kpis && reviewData.kpis.length > 0) {
        console.log("KPIs from reviewData (sin ID):", reviewData.kpis);
        
        let loadedKpis = [...reviewData.kpis].map((kpi: any) => {
          console.log("Processing individual KPI in useReviewForm (sin ID):", kpi);
          return {
            id: kpi.id,
            description: kpi.description || '',
            deadline: kpi.deadline || new Date().toISOString().split('T')[0],
            weight: Number(kpi.weight) || 0,
            completion_percentage: kpi.completion_percentage !== null ? kpi.completion_percentage : 0,
            supervisor_rating: kpi.supervisor_rating !== undefined ? kpi.supervisor_rating : 0,
            created_at: kpi.created_at || new Date().toISOString(),
            review_id: kpi.review_id || reviewData.id
          };
        });
        
        console.log("Loaded KPIs after mapping in useReviewForm (sin ID):", loadedKpis);
        
        if (loadedKpis.length === 0) {
          setKpis(defaultKpis);
        } else {
          setKpis(loadedKpis);
        }
      } else {
        console.log("No hay KPIs disponibles, usando valores por defecto");
        setKpis(defaultKpis);
      }

      // Solo usar las competencias de reviewData si no tenemos ID para cargar directamente desde la base de datos
      if (!reviewData.id && reviewData.skills && reviewData.skills.length > 0) {
        console.log("Cargando competencias desde reviewData:", reviewData.skills);
        
        const formattedSkills = reviewData.skills.map((skill: any) => {
          let level: "bajo" | "medio" | "alto" = "medio";
          
          if (skill.level === "bajo" || skill.level === "medio" || skill.level === "alto") {
            level = skill.level as "bajo" | "medio" | "alto";
          }
          
          return {
            name: skill.skill_name || skill.name,
            level: level
          };
        });
        
        const skillNames = new Set(formattedSkills.map((s: Skill) => s.name));
        const mergedSkills: Skill[] = [...formattedSkills];
        
        defaultSkills.forEach(defaultSkill => {
          if (!skillNames.has(defaultSkill.name)) {
            mergedSkills.push(defaultSkill);
          }
        });
        
        setSkills(mergedSkills);
      } else if (!reviewData.id) {
        console.log("No hay ID de revisión ni competencias en reviewData, usando las predeterminadas");
        setSkills(defaultSkills);
      }

      if (reviewData.id) {
        loadGoalsFromDatabase(reviewData.id);
      } else if (reviewData.goals && reviewData.goals.length > 0) {
        const goalsData = Array.isArray(reviewData.goals) 
          ? reviewData.goals.map((g: any) => typeof g === 'string' ? g : g.description)
          : [];
        console.log("Metas formateadas:", goalsData);
        setGoals(goalsData);
      } else {
        setGoals([]);
      }
    }
  }, [reviewData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Cambiando campo ${name} a:`, value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKpiChange = (index: number, field: keyof KPI, value: any) => {
    console.log(`handleKpiChange llamada para índice ${index}, campo ${String(field)}, valor recibido:`, value, typeof value);
    
    const newKpis = [...kpis];
    
    if (field === 'weight') {
      const numValue = Number(value) || 0;
      newKpis[index].weight = numValue;
      
      const totalWeight = newKpis.reduce((sum, kpi, i) => 
        i === index ? sum + numValue : sum + Number(kpi.weight || 0), 0);
      
      console.log(`Peso total después de cambio: ${totalWeight}%`);
    } else if (field === 'supervisor_rating') {
      // Convertir explícitamente el valor de calificación a número
      const numValue = Number(value);
      console.log(`Convirtiendo calificación para KPI ${index} de "${value}" (${typeof value}) a ${numValue} (${typeof numValue})`);
      
      // Asegurar que sea un número válido entre 0 y 10
      const boundedValue = isNaN(numValue) ? 0 : Math.min(Math.max(numValue, 0), 10);
      newKpis[index].supervisor_rating = boundedValue;
      
      console.log(`Valor final asignado a supervisor_rating para KPI ${index}:`, boundedValue, typeof boundedValue);
    } else {
      newKpis[index] = { ...newKpis[index], [field]: value };
    }
    
    setKpis(newKpis);
  };

  const addNewKpi = () => {
    const newKpis = [...kpis];
    const currentKpisCount = newKpis.length;
    
    const newWeight = Math.floor(100 / (currentKpisCount + 1));
    
    newKpis.forEach((kpi, index) => {
      kpi.weight = newWeight;
    });
    
    const remainingWeight = 100 - (newWeight * currentKpisCount);
    
    newKpis.push({
      description: '',
      deadline: new Date().toISOString().split('T')[0],
      weight: remainingWeight,
      completion_percentage: 0,
      supervisor_rating: 0
    });
    
    setKpis(newKpis);
  };

  const handleSkillChange = (skillName: string, level: "bajo" | "medio" | "alto") => {
    setSkills(skills.map(skill => 
      skill.name === skillName ? { ...skill, level } : skill
    ));
  };

  const handleGoalsChange = (newGoals: string[]) => {
    console.log("Actualización de metas:", newGoals);
    setGoals(newGoals);
  };

  const setValidationErrors = (show: boolean) => {
    setShowValidationErrors(show);
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error("Error al cargar perfil:", profileError);
            return;
          }

          if (profile) {
            setUserName(`${profile.first_name} ${profile.last_name}`);
          }
        }
      } catch (error) {
        console.error("Error en loadUserProfile:", error);
      }
    };

    loadUserProfile();
  }, []);

  return {
    userName,
    formData,
    skills,
    kpis,
    goals,
    showValidationErrors,
    handleChange,
    handleKpiChange,
    handleSkillChange,
    handleGoalsChange,
    setValidationErrors,
    addNewKpi
  };
}
