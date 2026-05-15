import { prisma } from "../../lib/prisma.js";
import { IconCreateDto } from "./icons.interface.js";

export const createIcon = async (payload: IconCreateDto) => {
  return prisma.icon.create({
    data: {
      name: payload.name.trim(),
      svg: payload.svg,
    },
  });
};

export const createIconsBulk = async (icons: IconCreateDto[]) => {
  const operations = icons.map((icon) =>
    prisma.icon.create({
      data: {
        name: icon.name.trim(),
        svg: icon.svg,
      },
    }),
  );

  return prisma.$transaction(operations);
};

export const getAllIcons = async () => {
  return prisma.icon.findMany({
    orderBy: { createdAt: "desc" },
  });
};
