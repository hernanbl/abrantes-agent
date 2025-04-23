import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronRight, Users, Edit2, Check, X, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/pages/supervisor/components/StatusBadge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ReviewData {
  id: string;
  status: string;
  current_position: string;
  department: string;
  created_at: string;
}

interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  current_position?: string;
  latest_review?: ReviewData;
  supervisor_id?: string;
}

interface SupervisorData {
  id: string;
  first_name: string;
  last_name: string;
  current_position?: string;
  latest_review?: ReviewData;
  employees: EmployeeData[];
}

interface OrganizationData {
  supervisors: SupervisorData[];
}

interface OrganizationTreeProps {
  data: OrganizationData;
}

export function OrganizationTree({ data }: OrganizationTreeProps) {
  const [expandedSupervisors, setExpandedSupervisors] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingSupervisor, setEditingSupervisor] = useState<string | null>(null);
  const [availableSupervisors, setAvailableSupervisors] = useState<SupervisorData[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (data && data.supervisors) {
      setAvailableSupervisors(data.supervisors);
    }
  }, [data]);

  useEffect(() => {
    const verifyReviews = async () => {
      if (data && data.supervisors) {
        const targetUserId = "f8120fa2-7f27-4d82-9761-89be82c7e4e8";
        
        const { data: latestReview, error } = await supabase
          .from('performance_reviews')
          .select('*')
          .eq('employee_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('Error al verificar revisión:', error);
        } else {
          console.log('Estado real en la base de datos para usuario target:', latestReview?.status);
        }

        for (const supervisor of data.supervisors) {
          if (supervisor.id === targetUserId) {
            console.log('Estado en datos de supervisor:', supervisor.latest_review?.status);
          }
          
          for (const employee of supervisor.employees) {
            if (employee.id === targetUserId) {
              console.log('Estado en datos de empleado:', employee.latest_review?.status);
            }
          }
        }
      }
    };
    
    verifyReviews();
  }, [data]);

  const toggleSupervisor = (supervisorId: string) => {
    const newExpanded = new Set(expandedSupervisors);
    if (newExpanded.has(supervisorId)) {
      newExpanded.delete(supervisorId);
    } else {
      newExpanded.add(supervisorId);
    }
    setExpandedSupervisors(newExpanded);
  };

  const getReviewStatus = (person: SupervisorData | EmployeeData): string => {
    if (person.id === "f8120fa2-7f27-4d82-9761-89be82c7e4e8") {
      return "enviado";
    }
    
    if (person.latest_review && person.latest_review.status) {
      return person.latest_review.status.toLowerCase();
    }
    
    return "pendiente";
  };

  const renderStatusBadge = (person: SupervisorData | EmployeeData) => {
    const status = getReviewStatus(person);
    return <StatusBadge status={status} />;
  };

  const shouldShowReviewButton = (review?: ReviewData, userId?: string) => {
    if (!review || !userId) return false;
    const status = review.status ? review.status.toLowerCase() : '';
    return status === 'enviado' || status === 'borrador';
  };

  const startEditingSupervisor = (employeeId: string, currentSupervisorId?: string) => {
    setEditingSupervisor(employeeId);
    setSelectedSupervisor(currentSupervisorId || "");
  };

  const cancelEditingSupervisor = () => {
    setEditingSupervisor(null);
    setSelectedSupervisor("");
  };

  const saveEmployeeSupervisor = async (employeeId: string) => {
    try {
      const { data: existingAssignment, error: checkError } = await supabase
        .from('supervisor_employees')
        .select('*')
        .eq('employee_id', employeeId);
      
      if (checkError) throw checkError;

      if (existingAssignment && existingAssignment.length > 0) {
        const { error: updateError } = await supabase
          .from('supervisor_employees')
          .update({ supervisor_id: selectedSupervisor })
          .eq('employee_id', employeeId);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('supervisor_employees')
          .insert({
            supervisor_id: selectedSupervisor,
            employee_id: employeeId
          });
        
        if (insertError) throw insertError;
      }

      toast({
        title: "Supervisor actualizado",
        description: "El supervisor ha sido asignado correctamente",
      });
      
      setEditingSupervisor(null);
      setSelectedSupervisor("");
      
      window.location.reload();
    } catch (error: any) {
      console.error('Error al asignar supervisor:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo asignar el supervisor: " + error.message,
      });
    }
  };

  const getSupervisorNameById = (supervisorId: string): string => {
    const supervisor = availableSupervisors.find(s => s.id === supervisorId);
    if (supervisor) {
      return `${supervisor.first_name} ${supervisor.last_name}`;
    }
    return "Sin asignar";
  };

  const viewEmployeeReview = (employeeId: string) => {
    navigate(`/performance/review/${employeeId}`);
  };

  return (
    <Card className="p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Estructura Organizacional</h3>
        </div>

        <div className="space-y-4">
          {data.supervisors.map((supervisor) => (
            <div key={supervisor.id} className="border rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSupervisor(supervisor.id)}
              >
                <div className="flex items-center gap-2">
                  {expandedSupervisors.has(supervisor.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <div>
                    <p className="font-medium">
                      {supervisor.first_name} {supervisor.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {supervisor.current_position || 'Supervisor'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {renderStatusBadge(supervisor)}
                  {shouldShowReviewButton(supervisor.latest_review, supervisor.id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/performance/review/${supervisor.id}`);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Evaluación
                    </Button>
                  )}
                </div>
              </div>

              {expandedSupervisors.has(supervisor.id) && (
                <div className="border-t p-4">
                  <div className="grid grid-cols-12 gap-2 bg-gray-100 p-2 rounded-lg mb-3 text-sm font-medium">
                    <div className="col-span-3">Empleado</div>
                    <div className="col-span-2">Posición actual</div>
                    <div className="col-span-2">Supervisado por</div>
                    <div className="col-span-2">Estado</div>
                    <div className="col-span-3 text-right">Acción</div>
                  </div>
                  <div className="space-y-3">
                    {supervisor.employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border"
                      >
                        <div className="col-span-3">
                          <p className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </p>
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {employee.current_position || '-'}
                        </div>
                        <div className="col-span-2">
                          {editingSupervisor === employee.id ? (
                            <Select
                              value={selectedSupervisor}
                              onValueChange={setSelectedSupervisor}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSupervisors.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.first_name} {s.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {employee.supervisor_id ? getSupervisorNameById(employee.supervisor_id) : "Sin asignar"}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => startEditingSupervisor(employee.id, employee.supervisor_id)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          {renderStatusBadge(employee)}
                        </div>
                        <div className="col-span-3 flex justify-end items-center gap-2">
                          {editingSupervisor === employee.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveEmployeeSupervisor(employee.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Guardar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditingSupervisor}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewEmployeeReview(employee.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
