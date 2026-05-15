import status from 'http-status';
import AppError from '../../errorHelpers/appError.js';
import { prisma } from '../../lib/prisma.js';
import { LogoCreateDto, LogoUpdateDto } from './logo.interface.js';

export const createLogo = async (payload: LogoCreateDto) => {
  return prisma.logo.create({ data: payload });
};

export const updateLogo = async (id: string, payload: LogoUpdateDto) => {
  const existingLogo = await prisma.logo.findUnique({ where: { id } });
  if (!existingLogo) {
    throw new AppError('Logo not found', status.NOT_FOUND);
  }
  return prisma.logo.update({
    where: { id },
    data: payload,
  });
};

export const getAllLogos = async () => {
  return prisma.logo.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const getLogoById = async (id: string) => {
  return prisma.logo.findUnique({ where: { id } });
};

export const getLatestLogo = async () => {
  return prisma.logo.findFirst({ orderBy: { createdAt: 'desc' } });
};

export const deleteLogo = async (id: string) => {
  const existingLogo = await prisma.logo.findUnique({ where: { id } });

  if (!existingLogo) {
    throw new AppError('Logo not found', status.NOT_FOUND);
  }

  return prisma.logo.delete({ where: { id } });
};
