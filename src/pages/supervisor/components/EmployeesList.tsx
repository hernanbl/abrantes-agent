import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Employee } from "../hooks/useSupervisorData";
import { supabase } from "@/integrations/supabase/client";
import { Eye } from "lucide-react";

interface EmployeesListProps {
  employees: Employee[];
}

export function EmployeesList({ employees }: EmployeesListProps) {
  const navigate = useNavigate();
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [supervisorNames, setSupervisorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSupervisorNames = async () => {
      const supervisorIds = employees
        .filter(emp => emp.supervisor_id)
        .map(emp => emp.supervisor_id as string);
      
      if (supervisorIds.length === 0) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', supervisorIds);
      
      if (error) {
        console.error('Error al cargar nombres de supervisores:', error);
        return;
      }
      
      const namesMap: Record<string, string> = {};
      data?.forEach(supervisor => {
        namesMap[supervisor.id] = `${supervisor.first_name} ${supervisor.last_name}`;
      });
      
      setSupervisorNames(namesMap);
    };
    
    loadSupervisorNames();
  }, [employees]);

  const handleRowClick = (employeeId: string) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  const handleReviewClick = (employeeId: string) => {
    navigate(`/performance/review/${employeeId}`);
  };

  const getReviewStatus = (employee: Employee) => {
    if (!employee.latest_review) {
      return "pendiente";
    }
    
    return employee.latest_review.status;
  };

  const getSupervisorName = (supervisorId: string | undefined) => {
    if (!supervisorId) return "Sin asignar";
    return supervisorNames[supervisorId] || "Cargando...";
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empleado</TableHead>
            <TableHead>Posición actual</TableHead>
            <TableHead>Supervisado por</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            const status = getReviewStatus(employee);
            
            return (
              <TableRow 
                key={employee.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(employee.id)}
              >
                <TableCell className="font-medium">
                  {employee.first_name} {employee.last_name}
                </TableCell>
                <TableCell>{employee.current_position || "-"}</TableCell>
                <TableCell>{getSupervisorName(employee.supervisor_id)}</TableCell>
                <TableCell>
                  <StatusBadge status={status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    className="bg-green-500 text-white hover:bg-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewClick(employee.id);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {employees.length === 0 && (
        <div className="text-center p-4">
          <p className="text-muted-foreground">No hay empleados asignados</p>
        </div>
      )}
    </>
  );
}
