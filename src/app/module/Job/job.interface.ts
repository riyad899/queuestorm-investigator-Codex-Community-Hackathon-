export interface ICreateDepartmentPayload {
  name: string;
}

export interface ICreateJobPayload {
  title: string;
  departmentId: string;
  jobType: string;
  location: string;
  experience: string;
  deadline: string | Date;
  description?: string;
}

export interface IUpdateJobPayload {
  title?: string;
  departmentId?: string;
  jobType?: string;
  location?: string;
  experience?: string;
  deadline?: string | Date;
  description?: string | null;
  isActive?: boolean;
}

export interface ICreateJobApplicationPayload {
  jobId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
}

export interface IJobQuery {
  department?: string;
  search?: string;
}
