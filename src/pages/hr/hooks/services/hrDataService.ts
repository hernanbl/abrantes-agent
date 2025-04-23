
import { supabase } from "@/integrations/supabase/client";
import { OrganizationData, ReviewData } from "../types/hrTypes";
import { 
  loadHRManagerProfile, 
  loadSupervisors, 
  processSupervisorData, 
  verifyHRManagerRole,
  getSupervisorEmployeeRelation,
  getSupervisorName,
  loadAllEmployees
} from "../utils/dataProcessing";

export async function fetchHRManagerData(userId: string) {
  try {
    // Verify HR Manager role
    const isHRManager = await verifyHRManagerRole(userId);
    if (!isHRManager) {
      return {
        isAuthorized: false,
        organizationData: { supervisors: [] },
        hrManagerReview: null,
        hrManagerName: "",
        supervisorId: null,
        supervisorName: null
      };
    }

    // Load HR Manager profile and review
    const { profile, hrReview } = await loadHRManagerProfile(userId);
    const hrManagerName = profile ? `${profile.first_name} ${profile.last_name}` : "";

    // Get HR Manager's supervisor
    const supervisorId = await getSupervisorEmployeeRelation(userId);
    const supervisorName = supervisorId ? await getSupervisorName(supervisorId) : null;

    // Load supervisors data
    const supervisors = await loadSupervisors();

    // Process each supervisor with their employees
    const supervisorsWithEmployees = await Promise.all(
      supervisors.map(async (supervisor) => {
        return await processSupervisorData(supervisor);
      })
    );

    // Filter out any null values from supervisors processing
    const filteredSupervisors = supervisorsWithEmployees.filter(Boolean);
    
    // Get all employees, including those who might not be assigned to any supervisor
    const allEmployees = await loadAllEmployees();
    
    // Find employees that don't have a supervisor or are not in any supervisor's employee list
    const employeesWithoutSupervisor = allEmployees.filter(employee => {
      // Check if this employee already appears under any supervisor
      const alreadyIncluded = filteredSupervisors.some(supervisor => 
        supervisor.id === employee.id || 
        supervisor.employees.some(emp => emp.id === employee.id)
      );
      return !alreadyIncluded;
    });
    
    console.log(`Found ${employeesWithoutSupervisor.length} employees without a supervisor`);
    
    // Find or create HR Manager entry in supervisors list
    let hrManagerNode = filteredSupervisors.find(s => s.id === userId);
    
    if (!hrManagerNode) {
      // Create HR Manager node if not present
      hrManagerNode = {
        id: userId,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        current_position: 'HR Manager',
        supervisor_id: supervisorId || '',
        latest_review: hrReview as ReviewData || null,
        employees: []
      };
      
      filteredSupervisors.push(hrManagerNode);
    }
    
    // Add all unassigned employees to HR Manager's direct reports
    for (const employee of employeesWithoutSupervisor) {
      // Skip if the employee is the HR Manager
      if (employee.id === userId) continue;
      
      console.log(`Adding employee ${employee.id} (${employee.first_name} ${employee.last_name}) to HR Manager's direct reports`);
      
      // Create relationship between HR Manager and employee if it doesn't exist
      const { data: existingRelation, error: relationError } = await supabase
        .from('supervisor_employees')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('supervisor_id', userId)
        .maybeSingle();
        
      if (relationError) {
        console.error('Error checking relation:', relationError);
      } else if (!existingRelation) {
        // Create new relationship
        const { error: insertError } = await supabase
          .from('supervisor_employees')
          .insert({
            supervisor_id: userId,
            employee_id: employee.id
          });
          
        if (insertError) {
          console.error(`Error creating relation for ${employee.id}:`, insertError);
        } else {
          console.log(`Relation created between HR ${userId} and employee ${employee.id}`);
        }
      }
      
      // Add employee to HR Manager's employees list if not already there
      const employeeAlreadyAdded = hrManagerNode.employees.some(emp => emp.id === employee.id);
      
      if (!employeeAlreadyAdded) {
        hrManagerNode.employees.push({
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          current_position: employee.current_position || 'Empleado',
          supervisor_id: userId,
          company_name: '',
          latest_review: employee.latest_review || null
        });
      }
    }

    console.log(`Total supervisors in organizational structure: ${filteredSupervisors.length}`);
    for (const supervisor of filteredSupervisors) {
      console.log(`Supervisor ${supervisor.id} (${supervisor.first_name} ${supervisor.last_name}) has ${supervisor.employees.length} employees`);
    }

    return {
      isAuthorized: true,
      organizationData: {
        supervisors: filteredSupervisors
      },
      hrManagerReview: hrReview as ReviewData | null,
      hrManagerName,
      supervisorId,
      supervisorName
    };
  } catch (error) {
    console.error('Error in fetchHRManagerData:', error);
    return {
      isAuthorized: false,
      organizationData: { supervisors: [] },
      hrManagerReview: null,
      hrManagerName: "",
      supervisorId: null,
      supervisorName: null
    };
  }
}
