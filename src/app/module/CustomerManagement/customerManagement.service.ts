import status from "http-status";
import { Role, userStatus } from "@prisma/client";
import AppError from "../../errorHelpers/appError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICustomerListQuery,
  IUpdateCustomerRolePayload,
  IUpdateCustomerStatusPayload,
} from "./customerManagement.interface.js";

const parseLimit = (value: string | undefined) => {
  const n = value ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  return Math.min(1000, Math.floor(n));
};

export const getCustomers = async (query: ICustomerListQuery) => {
  const search = typeof query.search === "string" ? query.search.trim() : undefined;
  const limit = parseLimit(query.limit);

  // Return ALL users (not just CUSTOMER) so admin can manage everyone
  return prisma.user.findMany({
    where: {
      AND: [
        { isdeleted: false },
        query.status ? { status: query.status } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      customer: true,
    },
  });
};

export const getLatestCustomers = async (limit?: number) => {
  return prisma.user.findMany({
    where: {
      role: Role.CUSTOMER,
      isdeleted: false,
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(50, Math.max(1, limit ?? 10)),
    include: {
      customer: true,
    },
  });
};

export const getCustomerById = async (id: string) => {
  const customer = await prisma.user.findFirst({
    where: {
      id,
      role: Role.CUSTOMER,
      isdeleted: false,
    },
    include: {
      customer: true,
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", status.NOT_FOUND);
  }

  return customer;
};

export const updateCustomerStatus = async (
  id: string,
  payload: IUpdateCustomerStatusPayload,
  requester: IRequestUser,
) => {
  const existing = await prisma.user.findFirst({
    where: { id },
  });

  if (!existing) {
    throw new AppError("User not found", status.NOT_FOUND);
  }

  if (existing.isdeleted) {
    throw new AppError("User is deleted", status.BAD_REQUEST);
  }

  // Prevent changing own status
  if (existing.id === requester.userId) {
    throw new AppError("You cannot change your own status", status.BAD_REQUEST);
  }

  // Only SUPER_ADMIN can change SUPER_ADMIN status
  if (existing.role === Role.SUPER_ADMIN && requester.role !== Role.SUPER_ADMIN) {
    throw new AppError("Only SUPER_ADMIN can change super admin user status", status.FORBIDDEN);
  }

  if (payload.status === userStatus.DELETED) {
    return prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          isdeleted: true,
          deletedAt: new Date(),
          status: userStatus.DELETED,
        },
      });

      await tx.session.deleteMany({ where: { userId: id } });
      await tx.account.deleteMany({ where: { userId: id } });

      return tx.user.findUnique({
        where: { id },
        include: { customer: true },
      });
    });
  }

  return prisma.user.update({
    where: { id },
    data: {
      status: payload.status,
    },
    include: { customer: true },
  });
};

export const updateCustomerRole = async (
  id: string,
  payload: IUpdateCustomerRolePayload,
  requester: IRequestUser,
) => {
  const existing = await prisma.user.findFirst({
    where: { id },
  });

  if (!existing) {
    throw new AppError("User not found", status.NOT_FOUND);
  }

  if (existing.isdeleted) {
    throw new AppError("User is deleted", status.BAD_REQUEST);
  }

  // Prevent changing own role
  if (existing.id === requester.userId) {
    throw new AppError("You cannot change your own role", status.BAD_REQUEST);
  }

  // Only SUPER_ADMIN can assign SUPER_ADMIN role
  if (payload.role === Role.SUPER_ADMIN && requester.role !== Role.SUPER_ADMIN) {
    throw new AppError("Only SUPER_ADMIN can assign SUPER_ADMIN role", status.FORBIDDEN);
  }

  // Only SUPER_ADMIN can change roles of existing SUPER_ADMIN users
  if (existing.role === Role.SUPER_ADMIN && requester.role !== Role.SUPER_ADMIN) {
    throw new AppError("Only SUPER_ADMIN can change super admin user roles", status.FORBIDDEN);
  }

  return prisma.user.update({
    where: { id },
    data: {
      role: payload.role,
    },
    include: { customer: true },
  });
};
