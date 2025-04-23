
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FormData {
  current_position: string;
  department: string;
  position_start_date: string;
}

interface PersonalInfoProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isReadOnly: boolean;
  showValidationErrors?: boolean;
  employeeName?: string;
}

export function PersonalInfo({ formData, handleChange, isReadOnly, showValidationErrors = false, employeeName }: PersonalInfoProps) {
  const hasErrors = showValidationErrors && (!formData.current_position || !formData.department || !formData.position_start_date);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Información Personal</h3>
      
      {employeeName && (
        <div className="bg-muted/50 p-4 rounded-md mb-4 border border-muted-foreground/20">
          <h4 className="text-md font-semibold mb-1">Empleado evaluado:</h4>
          <p className="text-lg">{employeeName}</p>
        </div>
      )}
      
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Todos los campos de información personal son obligatorios.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="current_position">Cargo actual y sector</Label>
        <Input
          id="current_position"
          name="current_position"
          value={formData.current_position || ''}
          onChange={handleChange}
          placeholder="Ej: Desarrollador Senior - IT"
          readOnly={isReadOnly}
          className={isReadOnly ? "bg-muted" : ""}
          required={!isReadOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Departamento</Label>
        <Input
          id="department"
          name="department"
          value={formData.department || ''}
          onChange={handleChange}
          placeholder="Ej: Tecnología"
          readOnly={isReadOnly}
          className={isReadOnly ? "bg-muted" : ""}
          required={!isReadOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position_start_date">
          Fecha de inicio en el puesto actual
        </Label>
        <Input
          id="position_start_date"
          name="position_start_date"
          type="date"
          value={formData.position_start_date || ''}
          onChange={handleChange}
          readOnly={isReadOnly}
          className={isReadOnly ? "bg-muted" : ""}
          required={!isReadOnly}
        />
      </div>
    </div>
  );
}
