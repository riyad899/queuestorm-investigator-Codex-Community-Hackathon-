import { Role, userStatus } from "@prisma/client";

export interface ICustomerListQuery {
  search?: string;
  status?: userStatus;
  limit?: string;
}

export interface IUpdateCustomerStatusPayload {
  status: userStatus;
}

export interface IUpdateCustomerRolePayload {
  role: Role;
}
