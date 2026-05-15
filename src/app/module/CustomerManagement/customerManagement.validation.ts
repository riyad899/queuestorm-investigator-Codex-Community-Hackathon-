import { Role, userStatus } from "@prisma/client";
import z from "zod";

export const updateCustomerStatusZodSchema = z.object({
  status: z.nativeEnum(userStatus),
});

export const updateCustomerRoleZodSchema = z.object({
  role: z.nativeEnum(Role),
});
