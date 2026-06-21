import z from "zod";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export const registerUserZodSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must be less than 50 characters long"),
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters long")
    .regex(
      strongPasswordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export const loginUserZodSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const verifyEmailZodSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
  otp: z.string({ error: "OTP is required" }).min(4, "OTP is invalid"),
});

export const forgetPasswordZodSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
});

export const resetPasswordZodSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
  otp: z.string({ error: "OTP is required" }).min(4, "OTP is invalid"),
  newPassword: z
    .string({ error: "New password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters long")
    .regex(
      strongPasswordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});
