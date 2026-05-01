import { Role } from "@prisma/client";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { ICreateStaffPayload, IUpdateStaffPayload } from "./staff.interface.js";
import status from "http-status";
import AppError from "../../errorHelpers/appError.js";

const createStaff = async (payload: ICreateStaffPayload) => {
  const userExist = await prisma.user.findUnique({
    where: { email: payload.staff.email },
  });

  if (userExist) {
    throw new AppError("User with this email already exists", status.CONFLICT);
  }

  const authStaff = (await auth.api.signUpEmail({
    body: {
      name: payload.staff.name,
      email: payload.staff.email,
      password: payload.password,
      role: Role.STAFF,
      needsPasswordReset: true,
    },
  } as any)) as any;

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const staffData = await tx.staff.create({
        data: {
          userID: authStaff.user.id,
          name: payload.staff.name,
          email: payload.staff.email,
          phone: payload.staff.phone,
          employeeNumber: `EMP-${Date.now()}`,
          experience: payload.staff.experience,
          gender: payload.staff.gender,
          bio: payload.staff.bio,
          salary: payload.staff.salary,
        },
      });

      const createdStaff = await tx.staff.findUnique({
        where: { id: staffData.id },
        include: {
          user: {
            select: {
              id: true, name: true, email: true, role: true,
              status: true, emailVerified: true,
            },
          },
        },
      });

      return createdStaff;
    });

    return result;
  } catch (error) {
    console.log("Transaction Error: " + error);
    await prisma.user.delete({ where: { id: authStaff.user.id } }).catch(() => undefined);
    if (error instanceof AppError) throw new AppError(error.message, error.statusCode, error.stack);
    if (error instanceof Error) throw new AppError(error.message, status.INTERNAL_SERVER_ERROR);
    throw new AppError("Failed to create staff", status.INTERNAL_SERVER_ERROR);
  }
};

const getAllStaff = async () => {
  const staffList = await prisma.staff.findMany({
    where: { isDeleted: false },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, role: true,
          status: true, emailVerified: true, createdAt: true, updatedAt: true,
        },
      },
    },
  });

  return { total: staffList.length, data: staffList };
};

const getStaffById = async (id: number) => {
  const staff = await prisma.staff.findFirst({
    where: { id, isDeleted: false },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, role: true,
          status: true, emailVerified: true, createdAt: true, updatedAt: true,
        },
      },
    },
  });

  if (!staff) throw new AppError("Staff not found", status.NOT_FOUND);
  return staff;
};

const deleteStaff = async (id: number) => {
  const staffExist = await prisma.staff.findUnique({ where: { id } });
  if (!staffExist) throw new AppError("Staff not found", status.NOT_FOUND);
  if (staffExist.isDeleted) throw new AppError("Staff already deleted", status.BAD_REQUEST);

  const staff = await prisma.staff.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return staff;
};

const updateStaff = async (id: number, payload: IUpdateStaffPayload) => {
  const staffExist = await prisma.staff.findUnique({ where: { id } });
  if (!staffExist) throw new AppError("Staff not found", status.NOT_FOUND);
  if (staffExist.isDeleted) throw new AppError("Cannot update a deleted staff member", status.BAD_REQUEST);

  const result = await prisma.$transaction(async (tx: any) => {
    const updatedStaff = await tx.staff.update({
      where: { id },
      data: {
        name: payload.staff.name,
        email: payload.staff.email,
        phone: payload.staff.phone,
        experience: payload.staff.experience,
        gender: payload.staff.gender,
        bio: payload.staff.bio,
        salary: payload.staff.salary,
      },
    });

    const data = await tx.staff.findUnique({
      where: { id: updatedStaff.id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, role: true,
            status: true, emailVerified: true, createdAt: true, updatedAt: true,
          },
        },
      },
    });

    return data;
  });

  return result;
};

export const StaffService = {
  createStaff, getAllStaff, deleteStaff, updateStaff, getStaffById,
};
