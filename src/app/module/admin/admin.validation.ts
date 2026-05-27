import z from "zod";
import { Role } from "@prisma/client";

export const updateAdminZodSchema = z.object({
    admin: z.object({
        name: z.string().optional(),
        profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "DELETED", "BLOCKED"]).optional(),
    }).optional()
})

export const updateAdminRoleZodSchema = z.object({
    role: z.nativeEnum(Role),
});