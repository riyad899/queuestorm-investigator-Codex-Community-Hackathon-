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

export const getIconById = async (id: string) => {
  const icon = await prisma.icon.findUnique({ where: { id } });
  if (!icon) {
    const status = (await import("http-status")).default;
    const AppError = (await import("../../errorHelpers/appError.js")).default;
    throw new AppError("Icon not found", status.NOT_FOUND);
  }
  return icon;
};

export const deleteIconById = async (id: string) => {
  const icon = await prisma.icon.findUnique({ where: { id } });
  if (!icon) {
    const status = (await import("http-status")).default;
    const AppError = (await import("../../errorHelpers/appError.js")).default;
    throw new AppError("Icon not found", status.NOT_FOUND);
  }

  await prisma.icon.delete({ where: { id } });
  return icon;
};

export const updateIconById = async (id: string, payload: { name?: string; svg?: string }) => {
  const icon = await prisma.icon.findUnique({ where: { id } });
  if (!icon) {
    const status = (await import("http-status")).default;
    const AppError = (await import("../../errorHelpers/appError.js")).default;
    throw new AppError("Icon not found", status.NOT_FOUND);
  }

  const updated = await prisma.icon.update({ where: { id }, data: {
    ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
    ...(payload.svg !== undefined ? { svg: payload.svg } : {}),
  }});

  return updated;
};

export const replaceIconById = async (id: string, payload: { name: string; svg: string }) => {
  const icon = await prisma.icon.findUnique({ where: { id } });
  if (!icon) {
    const status = (await import("http-status")).default;
    const AppError = (await import("../../errorHelpers/appError.js")).default;
    throw new AppError("Icon not found", status.NOT_FOUND);
  }

  const updated = await prisma.icon.update({ where: { id }, data: { name: payload.name.trim(), svg: payload.svg } });
  return updated;
};
