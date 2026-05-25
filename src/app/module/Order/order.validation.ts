import { DeliveryStatus, PaymentStatus } from "@prisma/client";
import z from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product id is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const createOrderZodSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  upazilaThana: z.string().min(1, "Upazila/Thana is required"),
  district: z.string().min(1, "District is required"),
  mobile: z.string().min(1, "Mobile is required"),
  email: z.string().email("Valid email is required"),
  comment: z.string().optional(),

  couponCode: z.string().min(1).optional(),

  paymentMethodKey: z.string().min(1).optional(),
  transactionId: z.string().min(1).optional(),
  deliveryMethodKey: z.string().min(1).optional(),

  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const getOrdersQueryZodSchema = z.object({
  search: z.string().min(1).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  deliveryStatus: z.nativeEnum(DeliveryStatus).optional(),
});

export const updateOrderPaymentZodSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
});

export const updateOrderDeliveryZodSchema = z.object({
  deliveryStatus: z.nativeEnum(DeliveryStatus),
});
