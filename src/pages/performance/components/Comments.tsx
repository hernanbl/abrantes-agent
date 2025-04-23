import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { StatusBadge } from "../../supervisor/components/StatusBadge";

interface CommentsProps {
  employeeComment: string;
  supervisorComment: string;
  onEmployeeCommentChange: (comment: string) => void;
  onSupervisorCommentChange: (comment: string) => void;
  isSupervisor: boolean;
  isHrManager?: boolean;
  readOnly?: boolean;
  status?: string;
  isCurrentUserTheEmployee?: boolean;
  onSaveEmployeeComment?: () => void;
  onSaveSupervisorComment?: () => void;
  isDirectSupervisor?: boolean;
}

export function Comments({
  employeeComment,
  supervisorComment,
  onEmployeeCommentChange,
  onSupervisorCommentChange,
  isSupervisor,
  isHrManager = false,
  readOnly = false,
  status = 'borrador',
  isCurrentUserTheEmployee = false,
  onSaveEmployeeComment,
  onSaveSupervisorComment,
  isDirectSupervisor = false
}: CommentsProps) {
  // Employee comment is visible to everyone
  const showEmployeeComment = true;
  
  // Check if form is submitted
  const isSubmitted = status === 'enviado';
  
  // Check if this is a supervisor viewing their own evaluation
  const isSupervisorViewingOwnEvaluation = isSupervisor && isCurrentUserTheEmployee;
  
  // Employee can only edit their comment if the form is not submitted
  const canEditEmployeeComment = isCurrentUserTheEmployee && !isSubmitted;
  
  // Only direct supervisors and HR managers can edit supervisor comments
  // Employees should never be able to edit supervisor comments
  const canEditSupervisorComment = (isDirectSupervisor || isHrManager) && !isSupervisorViewingOwnEvaluation && !isCurrentUserTheEmployee;

  // Show save button for employee comment when employee can edit
  const showSaveEmployeeCommentButton = canEditEmployeeComment && onSaveEmployeeComment;
  
  // Show save button for supervisor comment when supervisor/HR manager can edit
  const showSaveSupervisorCommentButton = canEditSupervisorComment && onSaveSupervisorComment;

  console.log('Comments component - Debug info:', { 
    isSupervisor, 
    isHrManager, 
    readOnly, 
    status, 
    isCurrentUserTheEmployee,
    isDirectSupervisor,
    isSupervisorViewingOwnEvaluation,
    canEditEmployeeComment, 
    canEditSupervisorComment,
    showEmployeeComment,
    showSaveEmployeeCommentButton,
    showSaveSupervisorCommentButton,
    employeeComment,
    supervisorComment,
    isSubmitted,
    hasOnSaveSupervisorComment: !!onSaveSupervisorComment
  });

  const handleSaveSupervisorComment = () => {
    console.log('Comments - handleSaveSupervisorComment called', {
      canEditSupervisorComment,
      onSaveSupervisorComment: !!onSaveSupervisorComment
    });
    
    if (onSaveSupervisorComment) {
      onSaveSupervisorComment();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Comentarios</h3>
        <StatusBadge status={status} />
      </div>
      
      <div className="space-y-4">
        {/* Employee comment - Always visible */}
        {showEmployeeComment && (
          <div className="space-y-2">
            <Label htmlFor="employeeComment">Comentario del Empleado</Label>
            {canEditEmployeeComment ? (
              <>
                <Textarea
                  id="employeeComment"
                  value={employeeComment || ""}
                  onChange={(e) => onEmployeeCommentChange(e.target.value)}
                  placeholder="Escribe tus comentarios, observaciones o sugerencias"
                  className="min-h-[100px]"
                />
                {showSaveEmployeeCommentButton && (
                  <div className="mt-2">
                    <Button 
                      onClick={onSaveEmployeeComment}
                      variant="outline"
                      size="sm"
                    >
                      <Save className="mr-1" size={16} />
                      Guardar comentario
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 rounded-md border bg-muted min-h-[100px]">
                {employeeComment || "Sin comentarios del empleado"}
              </div>
            )}
          </div>
        )}

        {/* Supervisor comment - Editable only by direct supervisors and HR managers, never by employees */}
        <div className="space-y-2">
          <Label htmlFor="supervisorComment">Comentario del Supervisor</Label>
          {canEditSupervisorComment ? (
            <>
              <Textarea
                id="supervisorComment"
                value={supervisorComment || ""}
                onChange={(e) => onSupervisorCommentChange(e.target.value)}
                placeholder="Comentarios del supervisor"
                className="min-h-[100px]"
              />
              {showSaveSupervisorCommentButton && (
                <div className="mt-2">
                  <Button 
                    onClick={handleSaveSupervisorComment}
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    <Save className="mr-1" size={16} />
                    Guardar comentario del supervisor
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 rounded-md border bg-muted min-h-[100px]">
              {supervisorComment || "Sin comentarios del supervisor"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
