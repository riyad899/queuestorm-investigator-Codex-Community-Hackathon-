import z from "zod";

const iconItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  svg: z.string().min(1, "SVG is required"),
});

export const createIconZodSchema = z.union([
  iconItemSchema,
  z.object({
    icons: z.array(iconItemSchema).min(1, "At least one icon is required"),
  }),
]);

export const updateIconZodSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  svg: z.string().min(1, "SVG is required").optional(),
}).refine((v) => Object.keys(v).length > 0, { message: "At least one field is required for update" });

export const replaceIconZodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  svg: z.string().min(1, "SVG is required"),
});
