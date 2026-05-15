import z from "zod";

export const createDepartmentZodSchema = z.object({
  name: z.string().min(1, "Department name is required"),
});

export const createJobZodSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  departmentId: z.string().min(1, "Department id is required"),
  jobType: z.string().min(1, "Job type is required"),
  location: z.string().min(1, "Location is required"),
  experience: z.string().min(1, "Experience is required"),
  deadline: z.coerce.date(),
  description: z.string().optional(),
});

export const updateJobZodSchema = z.object({
  title: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  jobType: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  experience: z.string().min(1).optional(),
  deadline: z.coerce.date().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one job field is required for update",
});

export const createJobApplicationZodSchema = z.object({
  jobId: z.string().min(1, "Job id is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  resumeUrl: z.string().url("Valid resume URL is required"),
});
