
import { useEffect, useState } from "react";
import { KPIHeader } from "./kpi/KPIHeader";
import { KPIRatingSummary } from "./kpi/KPIRatingSummary";
import { KPIActions } from "./kpi/KPIActions";
import { KPITable } from "./kpi/KPITable";

interface KPI {
  description: string;
  deadline: string;
  weight: number;
  completion_percentage?: number;
  supervisor_rating?: number;
  id?: string;
}

interface KPISectionProps {
  kpis: KPI[];
  handleKpiChange: (index: number, field: keyof KPI, value: any) => void;
  readOnly: boolean;
  showValidationErrors: boolean;
  isSupervisor: boolean;
  isSubmitted: boolean;
  onSaveRatings?: () => void;
  onAddKpi?: () => void;
  isCurrentUserTheEmployee?: boolean;
  isDirectSupervisor?: boolean;
  reviewId?: string;
  isHrManager?: boolean;
}

export function KPISection({
  kpis,
  handleKpiChange,
  readOnly,
  showValidationErrors,
  isSupervisor,
  isSubmitted,
  onSaveRatings,
  onAddKpi,
  isCurrentUserTheEmployee = false,
  isDirectSupervisor = false,
  reviewId,
  isHrManager = false
}: KPISectionProps) {
  console.log('KPISection Props:', { 
    kpisLength: kpis ? kpis.length : 0,
    kpiSample: kpis && kpis.length > 0 ? kpis[0].description : 'No KPIs',
    readOnly, 
    showValidationErrors, 
    isSupervisor,
    isSubmitted,
    isCurrentUserTheEmployee,
    isDirectSupervisor,
    onAddKpi: !!onAddKpi,
    onSaveRatings: !!onSaveRatings,
    isHrManager,
    reviewId
  });

  const isSupervisorViewingOwnEvaluation = isSupervisor && isCurrentUserTheEmployee;

  console.log('KPIs detallados en KPISection:', JSON.stringify(kpis, null, 2));

  const hasKpiError = showValidationErrors && kpis.some(kpi => !kpi.description?.trim());

  const [hasRatingError, setHasRatingError] = useState(false);

  const averageKpiValue = kpis.length > 0 ? kpis.reduce((sum, kpi) => {
    return kpi.supervisor_rating !== undefined ? sum + Number(kpi.supervisor_rating) : sum;
  }, 0) / (kpis.filter(kpi => kpi.description?.trim()).length || 1) : 0;

  // Solo puede editar ratings si es supervisor directo o HR manager y NO está viendo su propio formulario
  const canEditRatings = (isDirectSupervisor || isHrManager) && !isCurrentUserTheEmployee;
  
  const canEditKpis = !readOnly && isCurrentUserTheEmployee && !isSubmitted;

  useEffect(() => {
    const missingSupervisorRatings = kpis.some(
      kpi => kpi.description?.trim() && 
             (kpi.supervisor_rating === undefined || kpi.supervisor_rating === null)
    );
    setHasRatingError(missingSupervisorRatings && ((isDirectSupervisor || isHrManager) && !isCurrentUserTheEmployee));
  }, [kpis, isDirectSupervisor, isHrManager, isCurrentUserTheEmployee]);

  const hasValidKpis = kpis && kpis.length > 0;
  
  console.log('Antes de renderizar KPIRatingSummary:', { 
    averageKpiValue, 
    hasRatingError, 
    canEditRatings,
    canEditKpis
  });

  const handleSaveRatings = () => {
    console.log('KPISection - handleSaveRatings llamado con KPIs:', JSON.stringify(kpis, null, 2));
    if (onSaveRatings) {
      console.log('KPISection - Ejecutando onSaveRatings');
      onSaveRatings();
    } else {
      console.error('KPISection - No hay función onSaveRatings disponible');
    }
  };

  return (
    <div className="space-y-6">
      <KPIHeader 
        isCurrentUserTheEmployee={isCurrentUserTheEmployee}
        hasKpisError={hasKpiError}
        canEditKpis={canEditKpis}
        isReadOnly={readOnly}
        hasError={hasKpiError}
        isSubmitted={isSubmitted}
      />
      
      {hasValidKpis && (
        <KPIRatingSummary 
          averageRating={averageKpiValue} 
          hasAllRatings={!hasRatingError}
          showSupervisorView={(isSupervisor && !isCurrentUserTheEmployee) || isDirectSupervisor || isHrManager}
          isSubmitted={isSubmitted}
          canEditRatings={canEditRatings}
          onSaveRatings={handleSaveRatings}
          isDirectSupervisor={isDirectSupervisor && !isCurrentUserTheEmployee}
          isSupervisor={isSupervisor && !isCurrentUserTheEmployee}
          isHrManager={isHrManager && !isCurrentUserTheEmployee}
          hasRatingError={hasRatingError}
          isCurrentUserTheEmployee={isCurrentUserTheEmployee}
        />
      )}
      
      <KPITable 
        kpis={kpis} 
        handleKpiChange={handleKpiChange} 
        canEditKpis={canEditKpis}
        canEditRatings={canEditRatings}
        hasRatingError={hasRatingError}
        isCurrentUserTheEmployee={isCurrentUserTheEmployee}
      />
      
      {reviewId && (
        <KPIActions 
          onSaveRatings={handleSaveRatings}
          onAddKpi={onAddKpi}
          canAddKpi={canEditKpis}
          canSaveRatings={canEditRatings}
          hasRatingError={hasRatingError}
          isCurrentUserTheEmployee={isCurrentUserTheEmployee}
        />
      )}
    </div>
  );
}
