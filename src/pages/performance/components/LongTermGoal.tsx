
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LongTermGoalProps {
  value: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

export function LongTermGoal({ value, handleChange, readOnly = false }: LongTermGoalProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Objetivo Profesional a Largo Plazo
      </h3>
      <div className="space-y-2">
        <Label htmlFor="long_term_goal">Objetivo aspiracional</Label>
        <Input
          id="long_term_goal"
          name="long_term_goal"
          value={value || ''}
          onChange={handleChange}
          placeholder="Describe tu objetivo profesional a largo plazo"
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
    </div>
  );
}
