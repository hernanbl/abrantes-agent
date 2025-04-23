
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UserCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "./StatusBadge";

interface SupervisorReview {
  id: string;
  status: string;
  review_date: string;
  department: string;
  current_position: string;
}

interface SupervisorReviewSectionProps {
  review: SupervisorReview | null;
  getStatusBadge?: (status: string) => React.ReactNode;
}

export function SupervisorReviewSection({ review, getStatusBadge }: SupervisorReviewSectionProps) {
  const navigate = useNavigate();

  const handleNavigateToReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate(`/performance/review/${user.id}`);
    }
  };

  // Determinar si la evaluación está completa/enviada
  const isReviewCompleted = review?.status === 'enviado';

  // Use the provided getStatusBadge function or fallback to the StatusBadge component
  const renderStatusBadge = (status: string) => {
    if (getStatusBadge) {
      return getStatusBadge(status);
    }
    return <StatusBadge status={status} />;
  };

  return (
    <div className="rounded-lg border">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Mi Evaluación de Desempeño
        </h3>
        {review ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{review.current_position}</p>
                  <p className="text-sm text-muted-foreground">{review.department}</p>
                </div>
                {renderStatusBadge(review.status || 'pendiente')}
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={handleNavigateToReview}
              >
                {isReviewCompleted ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver tu Evaluación
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Completar Evaluación
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            No tienes una evaluación de desempeño activa.
          </p>
        )}
      </div>
    </div>
  );
}
