
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Company } from "../types";

interface CompanySelectorProps {
  companies: Company[];
  value: string;
  onChange: (value: string) => void;
}

const CompanySelector = ({ companies, value, onChange }: CompanySelectorProps) => {
  return (
    <div className="space-y-2 text-left">
      <Label htmlFor="company" className="text-left">Empresa</Label>
      <Select
        value={value}
        onValueChange={onChange}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona tu empresa" />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySelector;
