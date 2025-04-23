
import { supabase } from "@/integrations/supabase/client";
import { ReviewReport } from "./types";
import { toast } from "sonner";

export async function fetchReportData(reportType: string): Promise<ReviewReport[]> {
  try {
    // Fetch reviews with employee and supervisor IDs
    const { data: reviews, error } = await supabase
      .from('performance_reviews')
      .select(`
        id,
        department,
        current_position,
        status,
        review_date,
        employee_id,
        supervisor_id
      `)
      .order('review_date', { ascending: false });
    
    if (error) {
      console.error("Error al obtener los datos para el reporte:", error);
      toast.error("Error al generar el reporte");
      return [];
    }

    // Get all unique employee and supervisor IDs
    const employeeIds = reviews.map(r => r.employee_id);
    const supervisorIds = reviews.filter(r => r.supervisor_id).map(r => r.supervisor_id);
    
    // Fetch all relevant profiles at once
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', [...new Set([...employeeIds, ...supervisorIds])]);
    
    if (profilesError) {
      console.error("Error al obtener los perfiles:", profilesError);
      toast.error("Error al generar el reporte");
      return [];
    }
    
    // Create a lookup map for profiles
    const profilesMap = new Map();
    profiles?.forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Filter reviews based on report type
    let filteredReviews = reviews;
    if (reportType === "pending") {
      filteredReviews = reviews.filter(r => 
        r.status.toLowerCase() === 'pendiente' || 
        r.status.toLowerCase() === 'borrador'
      );
    } else if (reportType === "completed") {
      filteredReviews = reviews.filter(r => 
        r.status.toLowerCase() === 'enviado' || 
        r.status.toLowerCase() === 'aprobado'
      );
    }

    // Format the data for the report
    return filteredReviews.map(review => {
      const employeeProfile = profilesMap.get(review.employee_id);
      const supervisorProfile = profilesMap.get(review.supervisor_id);
      
      return {
        employee_name: employeeProfile 
          ? `${employeeProfile.first_name} ${employeeProfile.last_name}` 
          : 'N/A',
        supervisor_name: supervisorProfile 
          ? `${supervisorProfile.first_name} ${supervisorProfile.last_name}` 
          : 'N/A',
        department: review.department || 'N/A',
        position: review.current_position || 'N/A',
        status: review.status || 'Pendiente',
        review_date: new Date(review.review_date).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      };
    });
  } catch (error) {
    console.error("Error al generar el reporte:", error);
    toast.error("Error al generar el reporte");
    return [];
  }
}

export function exportToCSV(reportData: ReviewReport[]): void {
  // Create CSV content
  const headers = ["Empleado", "Supervisor", "Departamento", "Posición", "Estado", "Fecha de Evaluación"];
  const csvContent = [
    headers.join(","),
    ...reportData.map(row => [
      `"${row.employee_name}"`,
      `"${row.supervisor_name}"`,
      `"${row.department}"`,
      `"${row.position}"`,
      `"${row.status}"`,
      `"${row.review_date}"`
    ].join(","))
  ].join("\n");

  // Generate download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `reporte-evaluaciones-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success("Reporte exportado con éxito");
}
