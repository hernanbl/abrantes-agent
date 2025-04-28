import { Card, CardContent } from "@/components/ui/card";
import { PersonalInfo } from "./PersonalInfo";
import { KPISection } from "./KPISection";
import { SkillsEvaluation } from "./SkillsEvaluation";
import { DevelopmentGoals } from "./DevelopmentGoals";
import { Comments } from "./Comments";
import { ReviewFormHeader } from "./ReviewFormHeader";
import { ReviewFormActions } from "./ReviewFormActions";
import { useReviewForm } from "../hooks/useReviewForm";
import { validateForm } from "../utils/formValidation";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "../../supervisor/components/StatusBadge";

interface ReviewFormLayoutProps {
  reviewData: any;
  onSave: (formData: any, action?: 'save' | 'submit') => void;
  isSupervisor: boolean;
  isHrManager?: boolean;
  isReadOnly: boolean;
  showSubmitButton?: boolean;
  showSaveButton?: boolean;
  onSaveRatings?: () => void;
  onSaveSkills?: () => void;  // Nueva prop para guardar evaluación de competencias
  isCurrentUserTheEmployee?: boolean;
  isDirectSupervisor?: boolean;
  canEditDevelopmentGoals?: boolean;
  onSaveEmployeeComment?: (comment: string) => void;
  onSaveSupervisorComment?: (comment: string) => void;
  employeeName?: string;
  status?: string;
}

export function ReviewFormLayout({ 
  reviewData, 
  onSave, 
  isSupervisor, 
  isHrManager = false,
  isReadOnly,
  showSubmitButton = true,
  showSaveButton = true,
  onSaveRatings,
  onSaveSkills, // Añadida nueva prop
  isCurrentUserTheEmployee = false,
  isDirectSupervisor = false,
  canEditDevelopmentGoals = false,
  onSaveEmployeeComment,
  onSaveSupervisorComment,
  employeeName,
  status = 'borrador'
}: ReviewFormLayoutProps) {
  const { toast } = useToast();
  
  const {
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
  } = useReviewForm({ 
    reviewData, 
    isReadOnly
  });

  const isSubmitted = status === 'enviado';

  console.log("ReviewFormLayout - isSupervisor:", isSupervisor);
  console.log("ReviewFormLayout - isDirectSupervisor:", isDirectSupervisor);
  console.log("ReviewFormLayout - KPI props:", { 
    isSupervisor, 
    isDirectSupervisor,
    isReadOnly, 
    isSubmitted, 
    kpisLength: kpis.length,
    status
  });

  const reviewId = reviewData?.id;
  console.log("ReviewFormLayout - reviewId disponible:", reviewId);

  const handleSaveForm = (action: 'save' | 'submit' = 'save') => {
    if (isReadOnly) {
      toast({
        variant: "destructive",
        title: "No permitido",
        description: "Este formulario no puede ser modificado en este momento."
      });
      return;
    }
    
    if (isSubmitted && !isDirectSupervisor && !isHrManager) {
      toast({
        variant: "destructive",
        title: "No permitido",
        description: "Este formulario ya ha sido enviado y no puede ser modificado."
      });
      return;
    }
    
    if (action === 'submit') {
      setValidationErrors(true);
      
      if (!validateForm(formData, kpis, goals, toast)) {
        return;
      }
    }
    
    const completeFormData = {
      ...formData,
      kpis,
      skills,
      goals
    };
    
    console.log("Enviando datos al servidor:", completeFormData);
    onSave(completeFormData, action);
    
    if (action === 'save') {
      setValidationErrors(false);
    }
  };

  const handleSaveRatings = () => {
    if (!isDirectSupervisor && !isHrManager) {
      toast({
        variant: "destructive",
        title: "No permitido",
        description: "No tienes permisos para calificar KPIs."
      });
      return;
    }
    
    const completeFormData = {
      ...formData,
      kpis,
      skills,
      goals
    };
    
    if (onSaveRatings) {
      onSaveRatings();
    } else {
      onSave(completeFormData, 'save');
    }
  };

  const handleSaveSkills = () => {
    if (!isDirectSupervisor && !isHrManager) {
      toast({
        variant: "destructive",
        title: "No permitido",
        description: "No tienes permisos para evaluar competencias."
      });
      return;
    }
    
    console.log("ReviewFormLayout - Ejecutando handleSaveSkills");
    
    const completeFormData = {
      ...formData,
      kpis,
      skills,
      goals
    };
    
    if (onSaveSkills) {
      console.log("ReviewFormLayout - Llamando a onSaveSkills externo");
      onSaveSkills();
    } else {
      console.log("ReviewFormLayout - Guardando competencias dentro de todo el formulario");
      onSave(completeFormData, 'save');
    }
  };

  const handleSaveEmployeeComment = () => {
    if (!isCurrentUserTheEmployee) {
      toast({
        variant: "destructive",
        title: "No permitido",
        description: "No puedes añadir comentarios como empleado en este formulario."
      });
      return;
    }
    
    if (isSubmitted && !isDirectSupervisor && !isHrManager) {
      toast({
        variant: "destructive",
        title: "No permitido",
        description: "El formulario ya está enviado y no puedes modificar tu comentario."
      });
      return;
    }
    
    if (onSaveEmployeeComment) {
      onSaveEmployeeComment(formData.employee_comment);
    } else {
      const completeFormData = {
        ...formData,
        kpis,
        skills,
        goals
      };
      
      onSave(completeFormData, 'save');
      toast({
        title: "Comentario guardado",
        description: "Tu comentario ha sido guardado exitosamente"
      });
    }
  };

  const handleSaveSupervisorComment = () => {
    if (!isDirectSupervisor && !isHrManager) {
      toast({
        variant: "destructive",
        title: "No permitido",
        description: "Solo el supervisor o HR manager pueden modificar este comentario."
      });
      return;
    }
    
    if (onSaveSupervisorComment) {
      onSaveSupervisorComment(formData.supervisor_comment);
    } else {
      const completeFormData = {
        ...formData,
        kpis,
        skills,
        goals
      };
      
      onSave(completeFormData, 'save');
      toast({
        title: "Comentario guardado",
        description: "El comentario del supervisor ha sido guardado exitosamente"
      });
    }
  };

  const formStatus = status || 'borrador';
  
  console.log("Estado del formulario para Comments:", formStatus);
  console.log("Valores críticos para form rendering:", {
    isSupervisor,
    isDirectSupervisor,
    isHrManager,
    isReadOnly,
    isCurrentUserTheEmployee,
    canEditDevelopmentGoals,
    goals: goals.length,
    reviewId: !!reviewId,
    formStatus
  });
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <ReviewFormHeader>
          <StatusBadge status={formStatus} />
        </ReviewFormHeader>
        
        <CardContent className="space-y-6">
          <PersonalInfo
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly || isSubmitted}
            showValidationErrors={showValidationErrors}
            employeeName={employeeName}
          />
          
          <KPISection
            kpis={kpis}
            handleKpiChange={handleKpiChange}
            readOnly={isReadOnly}
            showValidationErrors={showValidationErrors}
            isSupervisor={isSupervisor}
            isSubmitted={isSubmitted}
            onSaveRatings={handleSaveRatings}
            onAddKpi={isSubmitted ? undefined : addNewKpi}
            isCurrentUserTheEmployee={isCurrentUserTheEmployee}
            isDirectSupervisor={isDirectSupervisor}
            reviewId={reviewId}
            isHrManager={isHrManager}
          />
          
          <SkillsEvaluation
            skills={skills}
            handleSkillChange={handleSkillChange}
            readOnly={isReadOnly || (!isDirectSupervisor && !isHrManager && isSubmitted)}
            showValidationErrors={showValidationErrors}
            canEditSkills={(isDirectSupervisor || isHrManager) && !isReadOnly}
            isCurrentUserTheEmployee={isCurrentUserTheEmployee}
            onSaveSkills={handleSaveSkills}
            reviewId={reviewId}
          />

          {/* El componente LongTermGoal ha sido eliminado para ocultar el campo "Objetivo Profesional a Largo Plazo" */}

          <DevelopmentGoals
            goals={goals}
            onGoalsChange={handleGoalsChange}
            readOnly={!canEditDevelopmentGoals || isReadOnly || isSubmitted}
            showValidationErrors={showValidationErrors}
            reviewId={reviewId}
          />

          <Comments
            employeeComment={formData.employee_comment}
            supervisorComment={formData.supervisor_comment}
            onEmployeeCommentChange={(comment) => handleChange({ target: { name: 'employee_comment', value: comment } } as any)}
            onSupervisorCommentChange={(comment) => handleChange({ target: { name: 'supervisor_comment', value: comment } } as any)}
            isSupervisor={isSupervisor}
            isHrManager={isHrManager}
            readOnly={isReadOnly}
            status={formStatus}
            isCurrentUserTheEmployee={isCurrentUserTheEmployee}
            onSaveEmployeeComment={onSaveEmployeeComment ? handleSaveEmployeeComment : undefined}
            onSaveSupervisorComment={onSaveSupervisorComment ? handleSaveSupervisorComment : undefined}
            isDirectSupervisor={isDirectSupervisor}
          />
        </CardContent>
        
        <ReviewFormActions 
          onSave={handleSaveForm}
          isReadOnly={isReadOnly || isSubmitted}
          showSubmitButton={showSubmitButton && !isSubmitted}
          showSaveButton={showSaveButton && !isSubmitted}
        />
      </Card>
    </div>
  );
}
