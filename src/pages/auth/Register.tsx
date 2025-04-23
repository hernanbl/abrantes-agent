
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { useCompanies } from "./hooks/useCompanies";
import RegisterForm from "./components/RegisterForm";

const Register = () => {
  const { companies } = useCompanies();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Crear cuenta</h2>
          <p className="text-sm text-muted-foreground">
            Ingresa tus datos para registrarte en el sistema
          </p>
        </CardHeader>
        <CardContent>
          <RegisterForm companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
