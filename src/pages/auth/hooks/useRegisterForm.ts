import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "../components/RoleSelector";

interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId: string;
  role: UserRole;
  supervisorId: string;
}

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    companyId: "",
    role: "employee" as UserRole,
    supervisorId: ""
  });

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || 
        !formData.lastName || !formData.companyId || !formData.role) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor, completa todos los campos del formulario.",
        duration: 5000,
      });
      return false;
    }
    
    if (formData.role === "employee" && !formData.supervisorId) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor, selecciona un supervisor.",
        duration: 5000,
      });
      return false;
    }
    
    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La contraseña debe tener al menos 6 caracteres.",
        duration: 5000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_id: formData.companyId,
            role: formData.role,
          },
        },
      });

      if (signUpError) {
        let errorMessage = "Ha ocurrido un error durante el registro. Por favor, intenta nuevamente.";
        
        switch (signUpError.message) {
          case "User already registered":
            errorMessage = "Este correo electrónico ya está registrado. Por favor, utiliza otro o inicia sesión.";
            break;
          case "Password should be at least 6 characters":
            errorMessage = "La contraseña debe tener al menos 6 caracteres.";
            break;
          case "Invalid email":
            errorMessage = "Por favor, ingresa un correo electrónico válido.";
            break;
          default:
            console.error("Error detallado:", signUpError);
            errorMessage = "Error en el registro. Por favor, verifica tus datos e intenta nuevamente.";
        }
        
        toast({
          variant: "destructive",
          title: "Error de registro",
          description: errorMessage,
          duration: 5000,
        });
        return;
      }

      if (signUpData.user) {
        const rolesToAssign = [];
        
        rolesToAssign.push({ user_id: signUpData.user.id, role: 'employee' });
        
        if (formData.role === 'supervisor') {
          rolesToAssign.push({ user_id: signUpData.user.id, role: 'supervisor' });
        }
        
        if (formData.role === 'hr_manager') {
          rolesToAssign.push({ user_id: signUpData.user.id, role: 'supervisor' });
          rolesToAssign.push({ user_id: signUpData.user.id, role: 'hr_manager' });
        }
        
        if (rolesToAssign.length > 0) {
          const { error: rolesError } = await supabase
            .from('user_roles')
            .insert(rolesToAssign);
            
          if (rolesError) {
            console.error("Error al asignar roles:", rolesError);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Se creó la cuenta pero hubo un problema al asignar los roles.",
              duration: 5000,
            });
          }
        }
        
        if (formData.supervisorId) {
          const { error: relationError } = await supabase
            .from('supervisor_employees')
            .insert({
              supervisor_id: formData.supervisorId,
              employee_id: signUpData.user.id
            });
            
          if (relationError) {
            console.error("Error al guardar la relación supervisor-empleado:", relationError);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Se creó tu cuenta pero hubo un problema al asignar el supervisor.",
              duration: 5000,
            });
          }
        }
        
        toast({
          variant: "default",
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada correctamente. Por favor, inicia sesión.",
          duration: 5000,
        });

        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          companyId: "",
          role: "employee",
          supervisorId: ""
        });

        setTimeout(() => {
          navigate("/auth/login");
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error en el registro",
          description: "No se pudo completar el registro. Por favor, intenta nuevamente.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('Error en el registro:', error);
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error.message || "Ha ocurrido un error durante el registro. Por favor, intenta nuevamente.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    handleSubmit
  };
};
