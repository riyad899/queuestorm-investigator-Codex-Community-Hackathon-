export interface ICreateStaffPayload {
  password: string;
  staff: {
    name: string;
    email: string;
    phone: string;
    experience?: number;
    gender?: string;
    bio?: string;
    salary?: number;
  };
}

export interface IUpdateStaffPayload {
  staff: {
    name?: string;
    email?: string;
    phone?: string;
    experience?: number;
    gender?: string;
    bio?: string;
    salary?: number;
  };
}
