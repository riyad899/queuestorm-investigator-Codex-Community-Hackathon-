import { userStatus } from "@prisma/client";

export interface ICreateAdminPayload {
  admin: {
    name: string;
    email: string;
    profilePhoto?: string;
  };
  password: string;
}

export interface IUpdateAdminPayload {
  admin: {
    name?: string;
    profilePhoto?: string;
    status?: userStatus;
  };
}
