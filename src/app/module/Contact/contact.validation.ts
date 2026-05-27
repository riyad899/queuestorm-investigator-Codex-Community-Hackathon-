import { z } from "zod";

export const createContactSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().max(14).optional(),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
