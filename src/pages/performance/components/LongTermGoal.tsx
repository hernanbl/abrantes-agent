import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UserCircle } from "lucide-react";

interface LongTermGoalProps {
  value: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

export function LongTermGoal({ value, handleChange, readOnly = false }: LongTermGoalProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Objetivo Profesional a Largo Plazo
        </h3>
        {!readOnly && (
          <div className="flex items-center gap-1 text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            <UserCircle className="h-4 w-4" />
            <span>Campo del empleado</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="long_term_goal">Objetivo aspiracional</Label>
        <Input
          id="long_term_goal"
          name="long_term_goal"
          value={value || ''}
          onChange={handleChange}
          placeholder="Describe tu objetivo profesional a largo plazo"
          readOnly={readOnly}
          className={`${readOnly ? "bg-muted" : "border-blue-300 focus-visible:ring-blue-500"} ${!readOnly ? "shadow-[0_0_0_1px_rgba(59,130,246,0.3)]" : ""}`}
        />
      </div>
    </div>
  );
}
