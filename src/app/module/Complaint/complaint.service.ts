import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { IComplaintResponse, ICreateComplaintPayload, IComplaintOrderInformation } from "./complaint.interface.js";

const complaintStore: IComplaintResponse[] = [];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ComplaintService {
  static async createComplaint(data: ICreateComplaintPayload) {
    try {
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.complaint) {
        const created = await prismaAny.complaint.create({
          data: {
            orderInformation: data.orderInformation,
            complaintType: data.complaintType,
            priorityLevel: data.priorityLevel,
            complaintDetails: data.complaintDetails,
            status: "Open",
          },
        });

        return created as IComplaintResponse;
      }

      const item: IComplaintResponse = {
        id: createId(),
        orderInformation: data.orderInformation,
        complaintType: data.complaintType,
        priorityLevel: data.priorityLevel,
        complaintDetails: data.complaintDetails,
        status: "Open",
        createdAt: new Date(),
      };

      complaintStore.unshift(item);
      return item;
    } catch (error) {
      throw new AppError("Failed to create complaint", 500);
    }
  }

  static async getComplaints() {
    try {
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.complaint) {
        return (await prismaAny.complaint.findMany({ orderBy: { createdAt: "desc" } })) as IComplaintResponse[];
      }

      return complaintStore;
    } catch (error) {
      throw new AppError("Failed to fetch complaints", 500);
    }
  }

  static async getComplaintById(id: string) {
    try {
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.complaint) {
        const item = await prismaAny.complaint.findUnique({ where: { id } });
        if (!item) throw new AppError("Complaint not found", 404);
        return item as IComplaintResponse;
      }

      const found = complaintStore.find((item) => item.id === id);
      if (!found) throw new AppError("Complaint not found", 404);
      return found;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch complaint", 500);
    }
  }

  static async updateComplaint(id: string, data: Partial<ICreateComplaintPayload> & { status?: string }) {
    try {
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.complaint) {
        const existing = await prismaAny.complaint.findUnique({ where: { id } });
        if (!existing) throw new AppError("Complaint not found", 404);

        const updated = await prismaAny.complaint.update({
          where: { id },
          data: {
            ...(data.orderInformation ? { orderInformation: data.orderInformation } : {}),
            ...(data.complaintType ? { complaintType: data.complaintType } : {}),
            ...(data.priorityLevel ? { priorityLevel: data.priorityLevel } : {}),
            ...(data.complaintDetails ? { complaintDetails: data.complaintDetails } : {}),
            ...(data.status ? { status: data.status } : {}),
          },
        });

        return updated as IComplaintResponse;
      }

      const index = complaintStore.findIndex((item) => item.id === id);
      if (index === -1) throw new AppError("Complaint not found", 404);

      complaintStore[index] = {
        ...complaintStore[index],
        ...(data.orderInformation ? { orderInformation: data.orderInformation as IComplaintOrderInformation } : {}),
        ...(data.complaintType ? { complaintType: data.complaintType } : {}),
        ...(data.priorityLevel ? { priorityLevel: data.priorityLevel } : {}),
        ...(data.complaintDetails ? { complaintDetails: data.complaintDetails } : {}),
        ...(data.status ? { status: data.status } : {}),
      };

      return complaintStore[index];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update complaint", 500);
    }
  }

  static async deleteComplaint(id: string) {
    try {
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.complaint) {
        await prismaAny.complaint.delete({ where: { id } });
        return { message: "Complaint deleted successfully" };
      }

      const index = complaintStore.findIndex((item) => item.id === id);
      if (index === -1) throw new AppError("Complaint not found", 404);
      complaintStore.splice(index, 1);
      return { message: "Complaint deleted successfully" };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete complaint", 500);
    }
  }
}
