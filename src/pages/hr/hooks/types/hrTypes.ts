
export interface ReviewData {
  id: string;
  status: string;
  current_position: string;
  department: string;
  created_at: string;
}

export interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  current_position: string;
  supervisor_id?: string;
  latest_review?: ReviewData;
  company_name?: string; // Added this property
}

export interface SupervisorData {
  id: string;
  first_name: string;
  last_name: string;
  current_position: string;
  supervisor_id?: string;
  latest_review?: ReviewData;
  employees: EmployeeData[];
}

export interface OrganizationData {
  supervisors: SupervisorData[];
}

export interface HRManagerData {
  loading: boolean;
  organizationData: OrganizationData;
  hrManagerReview: ReviewData | null;
  hrManagerName: string;
  supervisorId: string | null;
  supervisorName: string | null;
  supervisorFullData: SupervisorData | null;
  reloadData: () => void; // Adding the missing reloadData function type
}
