
export interface KPI {
  description: string;
  deadline: string;
  weight: number;
  completion_percentage?: number;
}

export interface Skill {
  name: string;
  level: "bajo" | "medio" | "alto";
}

export interface FormData {
  currentPosition: string;
  department: string;
  positionStartDate: string;
  longTermGoal: string;
}

export const defaultSkills: Skill[] = [
  { name: "Trabajo en equipo", level: "medio" },
  { name: "Liderazgo", level: "medio" },
  { name: "Comunicación efectiva", level: "medio" },
  { name: "Orientación a resultados", level: "medio" },
  { name: "Resolución de problemas", level: "medio" },
];
