
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useSupervisors } from "../hooks/useSupervisors";

interface SupervisorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required: boolean;
}

const SupervisorSelector = ({ value, onChange, required }: SupervisorSelectorProps) => {
  const { supervisors, loading } = useSupervisors();

  return (
    <div className="space-y-2 text-left">
      <Label htmlFor="supervisor" className="text-left">Supervisor a cargo</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading || supervisors.length === 0}
        required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder={
            loading 
              ? "Cargando supervisores..." 
              : supervisors.length === 0 
                ? "No hay supervisores registrados" 
                : "Selecciona tu supervisor"
          } />
        </SelectTrigger>
        <SelectContent>
          {supervisors.map((supervisor) => (
            <SelectItem key={supervisor.id} value={supervisor.id}>
              {supervisor.fullName}
            </SelectItem>
          ))}
          {!loading && supervisors.length === 0 && (
            <SelectItem value="none" disabled>
              No hay supervisores registrados
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {!loading && supervisors.length === 0 && (
        <p className="text-xs text-amber-500">
          No hay supervisores registrados. Deben registrarse primero los supervisores.
        </p>
      )}
    </div>
  );
};

export default SupervisorSelector;
