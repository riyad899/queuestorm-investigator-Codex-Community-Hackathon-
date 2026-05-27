export interface ICreateContactPayload {
  fullName: string;
  phone?: string;
  email: string;
  subject: string;
  message: string;
}

export interface IContactResponse {
  id: string;
  fullName: string;
  phone?: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}
