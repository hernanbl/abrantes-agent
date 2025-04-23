
import { Card, CardContent } from "@/components/ui/card";
import { LoginHeader } from "./components/LoginHeader";
import { LoginForm } from "./components/LoginForm";
import { useLoginSession } from "./hooks/useLoginSession";

const Login = () => {
  const { isCheckingSession } = useLoginSession();

  // No mostrar nada mientras se verifica la sesión
  if (isCheckingSession) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <LoginHeader />
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
