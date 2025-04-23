
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData, ReviewData, SupervisorData } from "../types/hrTypes";

// Helper para ordenar revisiones por fecha (más reciente primero)
export const sortReviewsByDate = (reviews: ReviewData[] = []): ReviewData[] => {
  return [...reviews].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// Obtener la revisión más reciente de una colección de revisiones
export const getLatestReview = (reviews: ReviewData[] = []): ReviewData | undefined => {
  const sortedReviews = sortReviewsByDate(reviews);
  return sortedReviews.length > 0 ? sortedReviews[0] : undefined;
};

// Cargar el perfil del HR Manager y su última revisión
export const loadHRManagerProfile = async (userId: string) => {
  // Obtener nombre del HR Manager
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error loading profile:', profileError);
    return { profile: null, hrReview: null };
  }

  // Cargar la última revisión del HR Manager
  const { data: hrReviews, error: reviewError } = await supabase
    .from('performance_reviews')
    .select('*')
    .eq('employee_id', userId)
    .order('created_at', { ascending: false });

  if (reviewError) {
    console.error('Error loading HR Manager reviews:', reviewError);
    return { profile, hrReview: null };
  }

  // Obtener la revisión más reciente
  const hrReview = hrReviews && hrReviews.length > 0 ? hrReviews[0] : null;
  
  return { 
    profile, 
    hrReview 
  };
};

// Cargar supervisores con sus últimas revisiones
export const loadSupervisors = async () => {
  // Obtener todos los IDs de usuarios supervisores
  const { data: supervisorRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'supervisor');

  if (rolesError) {
    console.error('Error loading supervisor roles:', rolesError);
    return [];
  }

  const supervisorIds = supervisorRoles?.map(ur => ur.user_id) || [];

  // Cargar perfiles de supervisores
  const { data: supervisors, error: supervisorsError } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name
    `)
    .in('id', supervisorIds);

  if (supervisorsError) {
    console.error('Error loading supervisors:', supervisorsError);
    return [];
  }

  // Para cada supervisor, obtener su revisión más reciente con una consulta directa
  const supervisorsWithReviews = [];
  for (const supervisor of supervisors || []) {
    // Obtener la revisión más reciente para cada supervisor con consulta directa
    const { data: latestReview, error: reviewError } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('employee_id', supervisor.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (reviewError) {
      console.error(`Error loading review for supervisor ${supervisor.id}:`, reviewError);
      continue;
    }
    
    supervisorsWithReviews.push({
      ...supervisor,
      latest_review: latestReview
    });
  }

  return supervisorsWithReviews || [];
};

// Cargar empleados para un supervisor
export const loadEmployeesForSupervisor = async (supervisorId: string) => {
  const { data: employeesData, error: employeesError } = await supabase
    .from('supervisor_employees')
    .select(`
      employee_id
    `)
    .eq('supervisor_id', supervisorId);

  if (employeesError) {
    console.error('Error loading employees for supervisor:', supervisorId, employeesError);
    return [];
  }

  const employeeIds = employeesData?.map(e => e.employee_id) || [];
  if (employeeIds.length === 0) return [];

  // Cargar perfiles de empleados
  const { data: employees, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name
    `)
    .in('id', employeeIds);

  if (profilesError) {
    console.error('Error loading employee profiles:', profilesError);
    return [];
  }

  // Para cada empleado, obtener su revisión más reciente directamente
  const employeesWithReviews = [];
  for (const employee of employees || []) {
    // Obtener la revisión más reciente directamente
    const { data: latestReview, error: reviewError } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (reviewError) {
      console.error(`Error loading review for employee ${employee.id}:`, reviewError);
      continue;
    }
    
    employeesWithReviews.push({
      employee: {
        ...employee,
        latest_review: latestReview
      }
    });
  }

  return employeesWithReviews;
};

// Load all employees regardless of supervisor assignment
export const loadAllEmployees = async () => {
  try {
    console.log('Loading all employees...');
    
    // Load all profiles - this is the key change to ensure ALL users are included
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name');
      
    if (allProfilesError) {
      console.error('Error loading all profiles:', allProfilesError);
      return [];
    }
    
    console.log(`Found ${allProfiles?.length || 0} total profiles`);
    
    // Check for critical users to ensure they're always included
    const criticalUserIds = [
      "0e607fc0-833b-4cdf-8e7d-7eb057e6cf82", // Hernán Blanco
      "0f22d03a-15c1-4de7-ae76-aa3f61fc5cba"  // New user that must be included
    ];
    
    // Verify critical users are included
    for (const userId of criticalUserIds) {
      const userIncluded = allProfiles?.some(profile => profile.id === userId);
      
      if (!userIncluded) {
        console.log(`Critical user ${userId} not found in profiles, checking directly`);
        
        // Check if user exists by direct lookup
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', userId)
          .maybeSingle();
          
        if (userError) {
          console.error(`Error checking profile for ${userId}:`, userError);
        } else if (userProfile) {
          console.log(`Found critical user ${userId}, adding to profiles list`);
          allProfiles?.push(userProfile);
        } else {
          console.log(`Critical user ${userId} does not exist in profiles table`);
        }
      } else {
        console.log(`Critical user ${userId} already included in profiles`);
      }
    }
    
    // Log profiles for debugging
    for (const profile of allProfiles || []) {
      if (criticalUserIds.includes(profile.id)) {
        console.log(`Critical user found in profiles: ${profile.id} (${profile.first_name} ${profile.last_name})`);
      }
    }
    
    // Get latest review and supervisor info for each profile
    const formattedEmployees = await Promise.all(
      (allProfiles || []).map(async (profile) => {
        // Get latest review
        const { data: latestReview, error: reviewError } = await supabase
          .from('performance_reviews')
          .select('id, status, current_position, department, created_at')
          .eq('employee_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (reviewError) {
          console.error(`Error loading review for ${profile.id}:`, reviewError);
        }
        
        // Get supervisor
        const { data: supervisionData, error: supervisionError } = await supabase
          .from('supervisor_employees')
          .select('supervisor_id')
          .eq('employee_id', profile.id)
          .maybeSingle();
          
        if (supervisionError) {
          console.error(`Error loading supervisor for ${profile.id}:`, supervisionError);
        }
        
        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          current_position: latestReview?.current_position || 'Empleado',
          supervisor_id: supervisionData?.supervisor_id,
          latest_review: latestReview || null
        };
      })
    );
    
    console.log(`Total formatted employees: ${formattedEmployees.length}`);
    return formattedEmployees;
  } catch (error) {
    console.error('Error in loadAllEmployees:', error);
    return [];
  }
};

// Procesar datos de empleado a un formato consistente
export const processEmployeeData = (employeeData: any): EmployeeData => {
  const employeeLatestReview = employeeData.employee.latest_review;
  
  return {
    id: employeeData.employee.id,
    first_name: employeeData.employee.first_name,
    last_name: employeeData.employee.last_name,
    current_position: employeeLatestReview?.current_position || 'Empleado',
    latest_review: employeeLatestReview,
    company_name: '' // Adding default value for company_name
  };
};

// Procesar datos de supervisor con sus empleados
export async function processSupervisorData(supervisor: any) {
  if (!supervisor) return null;

  try {
    const { data: employeesData, error: employeesError } = await supabase
      .from('supervisor_employees')
      .select(`
        employee:profiles!supervisor_employees_employee_id_fkey (
          id,
          first_name,
          last_name,
          company:companies (
            name
          )
        )
      `)
      .eq('supervisor_id', supervisor.id);

    if (employeesError) {
      console.error('Error al cargar empleados:', employeesError);
      return null;
    }

    const employees = await Promise.all(
      (employeesData || []).map(async (relation) => {
        if (!relation.employee) return null;

        // Obtenemos la última revisión del empleado
        const { data: latestReview, error: reviewError } = await supabase
          .from('performance_reviews')
          .select('id, status, current_position, department, created_at')
          .eq('employee_id', relation.employee.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (reviewError) {
          console.error('Error al cargar revisión:', reviewError);
        }

        // Obtenemos el supervisor del empleado
        const supervisorId = await getSupervisorEmployeeRelation(relation.employee.id);

        return {
          id: relation.employee.id,
          first_name: relation.employee.first_name,
          last_name: relation.employee.last_name,
          company_name: relation.employee.company?.name || '',
          current_position: latestReview?.current_position || 'Empleado',
          supervisor_id: supervisorId || '',
          latest_review: latestReview || null
        };
      })
    );

    // Filtramos valores nulos
    const filteredEmployees = employees.filter(Boolean);

    // Obtenemos la última revisión del supervisor
    const { data: supervisorReview, error: supervisorReviewError } = await supabase
      .from('performance_reviews')
      .select('id, status, current_position, department, created_at')
      .eq('employee_id', supervisor.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (supervisorReviewError) {
      console.error('Error al cargar revisión del supervisor:', supervisorReviewError);
    }

    // Si el supervisor también es un empleado, obtenemos su supervisor
    const supervisorSupervisorId = await getSupervisorEmployeeRelation(supervisor.id);

    return {
      id: supervisor.id,
      first_name: supervisor.first_name,
      last_name: supervisor.last_name,
      current_position: supervisorReview?.current_position || 'Supervisor',
      supervisor_id: supervisorSupervisorId || '',
      latest_review: supervisorReview || null,
      employees: filteredEmployees
    };
  } catch (error) {
    console.error('Error al procesar datos del supervisor:', error);
    return null;
  }
}

// Obtener la relación supervisor-empleado
export async function getSupervisorEmployeeRelation(employeeId: string) {
  const { data, error } = await supabase
    .from('supervisor_employees')
    .select('supervisor_id')
    .eq('employee_id', employeeId)
    .maybeSingle();

  if (error) {
    console.error('Error al obtener relación supervisor-empleado:', error);
    return null;
  }

  return data?.supervisor_id || null;
}

// Obtener el nombre del supervisor
export async function getSupervisorName(supervisorId: string): Promise<string | null> {
  if (!supervisorId) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', supervisorId)
    .maybeSingle();

  if (error || !data) {
    console.error('Error al obtener nombre del supervisor:', error);
    return null;
  }

  return `${data.first_name} ${data.last_name}`;
}

// Verificar si el usuario tiene rol de HR Manager
export const verifyHRManagerRole = async (userId: string): Promise<boolean> => {
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (roleError) {
    console.error('Error verifying role:', roleError);
    return false;
  }

  return userRole?.role === 'hr_manager';
};
