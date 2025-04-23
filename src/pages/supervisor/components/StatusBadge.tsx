
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" | null = null;
  let label = "";
  let customClass = "";

  switch (status.toLowerCase()) {
    case "enviado":
      variant = "default";
      customClass = "bg-green-500 hover:bg-green-600 text-white";
      label = "Enviado";
      break;
    case "borrador":
      variant = "secondary";
      customClass = "bg-orange-500 hover:bg-orange-600 text-white";
      label = "Borrador";
      break;
    case "pendiente":
    default:
      variant = "destructive";
      customClass = "bg-red-500 hover:bg-red-600 text-white";
      label = "Pendiente";
      break;
  }

  return (
    <Badge variant={variant} className={`text-xs ${customClass}`}>
      {label}
    </Badge>
  );
}
