import { userStatus } from "@prisma/client";
import z from "zod";

export const createAdminZodSchema = z.object({
  admin: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    profilePhoto: z.string().optional(),
  }),
  password: z.string().min(6),
});

export const updateAdminZodSchema = z.object({
  admin: z
    .object({
      name: z.string().min(1).optional(),
      profilePhoto: z.string().optional(),
      status: z.nativeEnum(userStatus).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: "No update data provided" }),
});
