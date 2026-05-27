import { z } from "zod";

export const createComplaintSchema = z.object({
  orderInformation: z.object({
    orderId: z.string().min(1, "Order ID is required"),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().max(14).optional(),
  }),
  complaintType: z.string().min(1, "Complaint type is required"),
  priorityLevel: z.string().min(1, "Priority level is required"),
  complaintDetails: z.string().min(1, "Complaint details are required"),
});

export const updateComplaintSchema = z.object({
  orderInformation: z
    .object({
      orderId: z.string().min(1).optional(),
      fullName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(14).optional(),
    })
    .optional(),
  complaintType: z.string().min(1).optional(),
  priorityLevel: z.string().min(1).optional(),
  complaintDetails: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
