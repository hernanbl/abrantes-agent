
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type UserRole = "employee" | "supervisor" | "hr_manager";

interface RoleSelectorProps {
  value: UserRole;
  onChange: (value: string) => void;
}

const RoleSelector = ({ value, onChange }: RoleSelectorProps) => {
  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center gap-2">
        <Label htmlFor="role" className="text-left">Rol</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>En esta aplicación, los roles son acumulativos:</p>
              <ul className="list-disc pl-4 mt-1 text-xs">
                <li>Todos los usuarios son empleados</li>
                <li>Los supervisores también son empleados</li>
                <li>El Gerente de RRHH también es supervisor y empleado</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select
        value={value}
        onValueChange={onChange}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona tu rol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="employee">Empleado</SelectItem>
          <SelectItem value="supervisor">Supervisor</SelectItem>
          <SelectItem value="hr_manager">Gerente de RRHH</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoleSelector;
