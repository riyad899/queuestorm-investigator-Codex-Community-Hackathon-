import status from "http-status";
import { Role, userStatus } from "@prisma/client";
import AppError from "../../errorHelpers/appError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { IUpdateAdminPayload } from "./admin.interface.js";

interface IChangeRolePayload {
    role: Role;
}

const getAllAdmins = async () => {
    const admins = await prisma.user.findMany({
        where: {
            role: {
                in: [Role.ADMIN, Role.SUPER_ADMIN],
            },
        },
    })

    return admins;
}

const getAdminById = async (id: string) => {
    const admin = await prisma.user.findFirst({
        where: {
            id,
            role: {
                in: [Role.ADMIN, Role.SUPER_ADMIN],
            },
        }
    })

    if (!admin) {
        throw new AppError("Admin or Super Admin not found", status.NOT_FOUND);
    }

    return admin;
}

const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
    const isAdminExist = await prisma.user.findFirst({
        where: {
            id,
            role: {
                in: [Role.ADMIN, Role.SUPER_ADMIN],
            },
        }
    })

    if (!isAdminExist) {
        throw new AppError("Admin or Super Admin not found", status.NOT_FOUND);
    }

    const { admin } = payload;
    if (!admin) {
        throw new AppError("No update data provided", status.BAD_REQUEST);
    }

    const updatedAdmin = await prisma.user.update({
        where: {
            id,
        },
        data: {
            ...(admin.name !== undefined ? { name: admin.name } : {}),
            ...(admin.profilePhoto !== undefined ? { image: admin.profilePhoto } : {}),
            ...(admin.status !== undefined ? { status: admin.status } : {}),
        }
    })

    return updatedAdmin;
}

const deleteAdmin = async (id: string, user: IRequestUser) => {
    const isAdminExist = await prisma.user.findFirst({
        where: {
            id,
            role: {
                in: [Role.ADMIN, Role.SUPER_ADMIN],
            },
        }
    })

    if (!isAdminExist) {
        throw new AppError("Admin or Super Admin not found", status.NOT_FOUND);
    }

    if (isAdminExist.id === user.userId) {
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
        })

        await tx.session.deleteMany({
            where: { userId: isAdminExist.id }
        })

        await tx.account.deleteMany({
            where: { userId: isAdminExist.id }
        })

        const admin = await tx.user.findUnique({
            where: { id },
        });

        return admin;
    }
    )

    return result;
}

export const AdminService = {
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    changeUserRole,
}

async function changeUserRole(id: string, payload: IChangeRolePayload, requester: IRequestUser) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) throw new AppError("User not found", status.NOT_FOUND);

    // Prevent changing own role
    if (user.id === requester.userId) {
        throw new AppError("You cannot change your own role", status.BAD_REQUEST);
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN
    if (payload.role === Role.SUPER_ADMIN && requester.role !== Role.SUPER_ADMIN) {
        throw new AppError("Only SUPER_ADMIN can assign SUPER_ADMIN role", status.FORBIDDEN);
    }

    const updated = await prisma.user.update({ where: { id }, data: { role: payload.role } });

    return updated;
}