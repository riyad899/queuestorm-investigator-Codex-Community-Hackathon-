import z from "zod";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export const createStaffZodSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters long")
    .regex(
      strongPasswordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  staff: z
    .object({
      name: z
        .string({ error: "Name is required" })
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must be less than 50 characters long"),
      email: z
        .string({ error: "Email is required" })
        .email("Invalid email format"),
      phone: z
        .string({ error: "Phone is required" })
        .max(14, "Phone number must be less than 14 characters long"),
      experience: z.number().int().positive().optional(),
      gender: z.enum(["MALE", "FEMALE"]).optional(),
      bio: z.string().optional(),
      salary: z.number().positive().optional(),
    })
    .strict(),
});

export const updateStaffZodSchema = z.object({
  staff: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must be less than 50 characters long")
        .optional(),
      email: z.string().email("Invalid email format").optional(),
      phone: z
        .string()
        .max(14, "Phone number must be less than 14 characters long")
        .optional(),
      experience: z.number().int().positive().optional(),
      gender: z.enum(["MALE", "FEMALE"]).optional(),
      bio: z.string().optional(),
      salary: z.number().positive().optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one staff field is required for update",
    }),
});
