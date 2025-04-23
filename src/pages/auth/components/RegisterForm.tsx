
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { Company } from "../types";
import { useRegisterForm } from "../hooks/useRegisterForm";
import SupervisorSelector from "./SupervisorSelector";
import CompanySelector from "./CompanySelector";
import RoleSelector, { UserRole } from "./RoleSelector";

interface RegisterFormProps {
  companies: Company[];
}

const RegisterForm = ({ companies }: RegisterFormProps) => {
  const navigate = useNavigate();
  const { formData, isLoading, handleChange, handleSubmit } = useRegisterForm();

  // This is a type guard to ensure TypeScript knows all possible values of formData.role
  const isHRManager = (role: UserRole): boolean => role === "hr_manager";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2 text-left">
        <Label htmlFor="firstName" className="text-left">Nombre</Label>
        <Input
          id="firstName"
          type="text"
          placeholder="Juan"
          value={formData.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="lastName" className="text-left">Apellido</Label>
        <Input
          id="lastName"
          type="text"
          placeholder="Pérez"
          value={formData.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="email" className="text-left">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="juan.perez@empresa.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="password" className="text-left">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="********"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          required
          minLength={6}
        />
      </div>
      
      <RoleSelector 
        value={formData.role} 
        onChange={(value) => handleChange("role", value as UserRole)} 
      />

      {!isHRManager(formData.role) && (
        <SupervisorSelector
          value={formData.supervisorId}
          onChange={(value) => handleChange("supervisorId", value)}
          required={!isHRManager(formData.role)}
        />
      )}

      <CompanySelector
        companies={companies}
        value={formData.companyId}
        onChange={(value) => handleChange("companyId", value)}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || (!isHRManager(formData.role) && !formData.supervisorId)}
      >
        {isLoading ? (
          "Registrando..."
        ) : (
          <>
            <User className="mr-2 h-4 w-4" /> Registrarme
          </>
        )}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => navigate("/auth/login")}
        >
          Iniciar sesión
        </Button>
      </p>
    </form>
  );
};

export default RegisterForm;
