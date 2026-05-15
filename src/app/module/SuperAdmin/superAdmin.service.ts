import status from "http-status";
import { Role, userStatus } from "@prisma/client";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { auth } from "../../lib/auth.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { ICreateAdminPayload, IUpdateAdminPayload } from "./superAdmin.interface.js";

const createAdmin = async (payload: ICreateAdminPayload) => {
  const userExist = await prisma.user.findUnique({ where: { email: payload.admin.email } });
  if (userExist) {
    throw new AppError("User with this email already exists", status.CONFLICT);
  }

  const created = (await auth.api.signUpEmail({
    body: {
      name: payload.admin.name,
      email: payload.admin.email,
      password: payload.password,
      role: Role.ADMIN,
      needsPasswordReset: true,
    },
  } as any)) as any;

  if (!created?.user?.id) {
    throw new AppError("Failed to create admin", status.INTERNAL_SERVER_ERROR);
  }

  try {
    const admin = await prisma.user.update({
      where: { id: created.user.id },
      data: {
        ...(payload.admin.profilePhoto !== undefined ? { image: payload.admin.profilePhoto } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return admin;
  } catch {
    await prisma.user.delete({ where: { id: created.user.id } }).catch(() => undefined);
    throw new AppError("Failed to create admin", status.INTERNAL_SERVER_ERROR);
  }
};

const getAllAdmins = async () => {
  const admins = await prisma.user.findMany({
    where: {
      role: Role.ADMIN,
      isdeleted: false,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return admins;
};

const getAdminById = async (id: string) => {
  const admin = await prisma.user.findFirst({
    where: {
      id,
      role: Role.ADMIN,
      isdeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!admin) {
    throw new AppError("Admin not found", status.NOT_FOUND);
  }

  return admin;
};

const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
  const isAdminExist = await prisma.user.findFirst({
    where: {
      id,
      role: Role.ADMIN,
    },
  });

  if (!isAdminExist || isAdminExist.isdeleted) {
    throw new AppError("Admin not found", status.NOT_FOUND);
  }

  const { admin } = payload;
  if (!admin) {
    throw new AppError("No update data provided", status.BAD_REQUEST);
  }

  const updatedAdmin = await prisma.user.update({
    where: { id },
    data: {
      ...(admin.name !== undefined ? { name: admin.name } : {}),
      ...(admin.profilePhoto !== undefined ? { image: admin.profilePhoto } : {}),
      ...(admin.status !== undefined ? { status: admin.status } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedAdmin;
};

const deleteAdmin = async (id: string, user: IRequestUser) => {
  const admin = await prisma.user.findFirst({
    where: {
      id,
      role: Role.ADMIN,
    },
  });

  if (!admin) {
    throw new AppError("Admin not found", status.NOT_FOUND);
  }

  if (admin.isdeleted) {
    throw new AppError("Admin already deleted", status.BAD_REQUEST);
  }

  if (admin.id === user.userId) {
    throw new AppError("You cannot delete yourself", status.BAD_REQUEST);
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        isdeleted: true,
        deletedAt: new Date(),
        status: userStatus.DELETED,
      },
    });

    await tx.session.deleteMany({ where: { userId: admin.id } });
    await tx.account.deleteMany({ where: { userId: admin.id } });

    return tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  return result;
};

export const SuperAdminService = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
