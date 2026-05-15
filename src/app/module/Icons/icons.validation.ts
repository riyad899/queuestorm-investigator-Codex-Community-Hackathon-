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
