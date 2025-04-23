
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

interface ReviewFormActionsProps {
  onSave: (action: 'save' | 'submit') => void;
  isReadOnly: boolean;
  showSubmitButton?: boolean;
  showSaveButton?: boolean;
}

export function ReviewFormActions({ 
  onSave, 
  isReadOnly, 
  showSubmitButton = true, 
  showSaveButton = true 
}: ReviewFormActionsProps) {
  // Si es de solo lectura o no se debe mostrar ningún botón, no renderizar nada
  if (isReadOnly || (!showSubmitButton && !showSaveButton)) {
    console.log("ReviewFormActions - No mostrando botones porque:", {isReadOnly, showSubmitButton, showSaveButton});
    return null;
  }
  
  return (
    <CardFooter className="flex justify-end gap-4">
      {showSaveButton && (
        <Button
          variant="outline"
          onClick={() => onSave('save')}
        >
          Guardar como borrador
        </Button>
      )}
      {showSubmitButton && (
        <Button
          onClick={() => onSave('submit')}
        >
          Enviar evaluación
        </Button>
      )}
    </CardFooter>
  );
}
