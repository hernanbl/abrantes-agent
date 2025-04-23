
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RatingCount {
  name: string;
  value: number;
  color: string;
}

export function SupervisorRatingsPieChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RatingCount[]>([]);

  // Colores para las diferentes calificaciones
  const RATING_COLORS = {
    "MALO": "#EF4444",      // Rojo
    "Regular": "#F97316",   // Naranja
    "Bueno": "#38BDF8",     // Celeste
    "Muy Bueno": "#10B981", // Verde
    "Excelente": "#8B5CF6", // Violeta
    "Sin Calificar": "#6B7280" // Gris para no calificadas
  };

  useEffect(() => {
    const generateRatingsReport = async () => {
      try {
        setLoading(true);
        
        // Obtener todos los KPIs con calificaciones de supervisores
        const { data: kpis, error: kpisError } = await supabase
          .from('performance_kpis')
          .select(`
            supervisor_rating,
            review_id,
            performance_reviews!inner (
              employee_id,
              status
            )
          `)
          .not('supervisor_rating', 'is', null)
          .eq('performance_reviews.status', 'enviado');

        if (kpisError) {
          console.error("Error al obtener calificaciones:", kpisError);
          toast.error("Error al generar el reporte de calificaciones");
          return;
        }

        // Agrupar por empleado y calcular promedio de calificaciones
        const employeeRatings: Record<string, number[]> = {};
        
        kpis?.forEach(kpi => {
          if (kpi.supervisor_rating !== null && kpi.performance_reviews.employee_id) {
            const employeeId = kpi.performance_reviews.employee_id;
            if (!employeeRatings[employeeId]) {
              employeeRatings[employeeId] = [];
            }
            employeeRatings[employeeId].push(kpi.supervisor_rating);
          }
        });

        // Calcular promedios y clasificar en categorías
        const ratingCounts: Record<string, number> = {
          "MALO": 0,
          "Regular": 0,
          "Bueno": 0,
          "Muy Bueno": 0,
          "Excelente": 0,
          "Sin Calificar": 0
        };

        Object.values(employeeRatings).forEach(ratings => {
          // Calcular promedio de calificaciones para este empleado
          const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          
          // Clasificar según rangos
          if (average >= 0 && average <= 3) {
            ratingCounts["MALO"]++;
          } else if (average > 3 && average <= 6) {
            ratingCounts["Regular"]++;
          } else if (average > 6 && average <= 7) {
            ratingCounts["Bueno"]++;
          } else if (average > 7 && average <= 8) {
            ratingCounts["Muy Bueno"]++;
          } else if (average > 8 && average <= 10) {
            ratingCounts["Excelente"]++;
          } else {
            ratingCounts["Sin Calificar"]++;
          }
        });

        // Convertir a formato para gráfico
        const chartData: RatingCount[] = Object.entries(ratingCounts)
          .filter(([_, count]) => count > 0) // Solo incluir categorías con al menos un empleado
          .map(([rating, count]) => ({
            name: rating,
            value: count,
            color: RATING_COLORS[rating as keyof typeof RATING_COLORS]
          }));

        setData(chartData);
      } catch (error) {
        console.error("Error al generar el reporte de calificaciones:", error);
        toast.error("Error al generar el reporte de calificaciones");
      } finally {
        setLoading(false);
      }
    };

    generateRatingsReport();
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
          <p>{data.value} empleados ({data.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Distribución de Calificaciones</h3>
      
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
