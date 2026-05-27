export interface IComplaintOrderInformation {
  orderId: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface ICreateComplaintPayload {
  orderInformation: IComplaintOrderInformation;
  complaintType: string;
  priorityLevel: string;
  complaintDetails: string;
}

export interface IComplaintResponse {
  id: string;
  orderInformation: IComplaintOrderInformation;
  complaintType: string;
  priorityLevel: string;
  complaintDetails: string;
  status: string;
  createdAt: Date;
}
