import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StatusCount {
  name: string;
  value: number;
  color: string;
}

export function StatusPieChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatusCount[]>([]);

  // Colores para los diferentes estados - alineados con los colores del sistema
  const STATUS_COLORS = {
    Pendiente: "#ea384c", // Rojo
    Borrador: "#F97316",  // Naranja
    Enviado: "#10B981",   // Verde
    Aprobado: "#059669",  // Verde oscuro
    default: "#6B7280"    // Gris para otros estados
  };

  useEffect(() => {
    const generateStatusReport = async () => {
      try {
        setLoading(true);
        
        // Obtener todos los perfiles (empleados) primero
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id');

        if (profilesError) {
          console.error("Error al obtener perfiles:", profilesError);
          toast.error("Error al generar el reporte de estado");
          return;
        }

        // Crear un array de IDs de empleados
        const employeeIds = profiles.map(profile => profile.id);

        // Obtener la revisión más reciente para cada empleado
        const { data: reviews, error: reviewsError } = await supabase
          .from('performance_reviews')
          .select('status, employee_id')
          .in('employee_id', employeeIds);

        if (reviewsError) {
          console.error("Error al obtener revisiones:", reviewsError);
          toast.error("Error al generar el reporte de estado");
          return;
        }

        // Agrupar por estado y contar
        const statusCounts: Record<string, number> = {};
        
        // Primero, inicializar contadores para todos los estados posibles
        statusCounts['Pendiente'] = 0;
        statusCounts['Borrador'] = 0;
        statusCounts['Enviado'] = 0;
        statusCounts['Aprobado'] = 0;

        // Para empleados sin evaluación, contarlos como "Pendiente"
        const employeesWithReviews = new Set(reviews.map(r => r.employee_id));
        const pendingEmployees = employeeIds.filter(id => !employeesWithReviews.has(id));
        statusCounts['Pendiente'] = pendingEmployees.length;

        // Contar los estados de las evaluaciones existentes
        reviews?.forEach(review => {
          const status = review.status.toLowerCase();
          let normalizedStatus;
          
          if (status.includes('pendiente')) {
            normalizedStatus = 'Pendiente';
          } else if (status.includes('borrador') || status.includes('draft')) {
            normalizedStatus = 'Borrador';
          } else if (status.includes('enviado')) {
            normalizedStatus = 'Enviado';
          } else if (status.includes('aprobado')) {
            normalizedStatus = 'Aprobado';
          } else {
            normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
          }
          
          statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] || 0) + 1;
        });

        // Convertir a formato para gráfico
        const chartData: StatusCount[] = Object.entries(statusCounts)
          .filter(([_, count]) => count > 0) // Solo incluir estados con al menos una evaluación
          .map(([status, count]) => ({
            name: status,
            value: count,
            color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default
          }));

        setData(chartData);
      } catch (error) {
        console.error("Error al generar el reporte de estado:", error);
        toast.error("Error al generar el reporte de estado");
      } finally {
        setLoading(false);
      }
    };

    generateStatusReport();
  }, []);

  // Calcular porcentajes para mostrar en el tooltip
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1)
  }));

  // Renderizado del tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p>{data.value} evaluaciones ({data.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Distribución de Estados</h3>
      
      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-10 text-gray-500">
          No hay datos disponibles para mostrar
        </div>
      )}
    </Card>
  );
}
