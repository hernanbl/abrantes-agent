
import { LogIn } from "lucide-react";
import { CardHeader } from "@/components/ui/card";

export const LoginHeader = () => {
  return (
    <CardHeader className="space-y-1 text-center">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn className="h-6 w-6 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Iniciar sesión</h2>
      <p className="text-sm text-muted-foreground">
        Ingresa tus credenciales para acceder al sistema
      </p>
    </CardHeader>
  );
};
