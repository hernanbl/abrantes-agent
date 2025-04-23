
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface KPIRatingSummaryProps {
  totalPoints?: number;
  expectedTotalPoints?: number;
  hasRatingError?: boolean;
  canEditRatings?: boolean;
  isSupervisor?: boolean;
  isDirectSupervisor?: boolean;
  isHrManager?: boolean;
  onSaveRatings?: () => void;
  averageRating?: number;
  hasAllRatings?: boolean;
  showSupervisorView?: boolean;
  isSubmitted?: boolean;
  isCurrentUserTheEmployee?: boolean;
}

export function KPIRatingSummary({
  totalPoints = 0,
  expectedTotalPoints = 100,
  hasRatingError = false,
  canEditRatings = false,
  isSupervisor = false,
  isDirectSupervisor = false,
  isHrManager = false,
  onSaveRatings,
  averageRating = 0,
  hasAllRatings = false,
  showSupervisorView = false,
  isSubmitted = false,
  isCurrentUserTheEmployee = false
}: KPIRatingSummaryProps) {
  // Use averageRating if provided, otherwise calculate from totalPoints
  const displayRating = averageRating !== undefined ? averageRating : totalPoints;
  const displayExpected = 10; // We're using a 0-10 scale

  console.log("KPIRatingSummary - Props detalladas:", { 
    canEditRatings, 
    isSubmitted, 
    isDirectSupervisor, 
    isSupervisor, 
    isHrManager,
    averageRating,
    onSaveRatings: !!onSaveRatings,
    hasRatingError,
    displayRating,
    isCurrentUserTheEmployee
  });

  // Verificación adicional: nunca mostrar botones de edición cuando es el propio empleado
  const effectiveCanEditRatings = canEditRatings && !isCurrentUserTheEmployee;

  return (
    <div className="bg-muted/50 p-4 rounded-md mt-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          <span className="font-medium">Puntuación promedio: {displayRating.toFixed(1)} / {displayExpected}</span>
        </div>
      </div>
    </div>
  );
}
