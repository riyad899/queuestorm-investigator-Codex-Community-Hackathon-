import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { ICreateContactPayload, IContactResponse } from "./contact.interface.js";

// In-memory fallback store when Prisma model is not available.
const memoryStore: IContactResponse[] = [];

export class ContactService {
  static async createMessage(data: ICreateContactPayload) {
    try {
      // Try to use Prisma model if it exists
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.contactMessage) {
        const created = await prismaAny.contactMessage.create({ data });
        return created as IContactResponse;
      }

      // fallback: create in-memory
      const newItem: IContactResponse = {
        id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        subject: data.subject,
        message: data.message,
        createdAt: new Date(),
      };
      memoryStore.unshift(newItem);
      return newItem;
    } catch (error) {
      throw new AppError("Failed to create contact message", 500);
    }
  }

  static async getMessages() {
    try {
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.contactMessage) {
        const list = await prismaAny.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
        return list as IContactResponse[];
      }

      return memoryStore;
    } catch (error) {
      throw new AppError("Failed to fetch contact messages", 500);
    }
  }

  static async getMessageById(id: string) {
    try {
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.contactMessage) {
        const item = await prismaAny.contactMessage.findUnique({ where: { id } });
        if (!item) throw new AppError("Message not found", 404);
        return item as IContactResponse;
      }

      const found = memoryStore.find((m) => m.id === id);
      if (!found) throw new AppError("Message not found", 404);
      return found;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch message", 500);
    }
  }

  static async deleteMessage(id: string) {
    try {
      const prismaAny = prisma as any;
      if (prismaAny && prismaAny.contactMessage) {
        await prismaAny.contactMessage.delete({ where: { id } });
        return { message: "Message deleted successfully" };
      }

      const idx = memoryStore.findIndex((m) => m.id === id);
      if (idx === -1) throw new AppError("Message not found", 404);
      memoryStore.splice(idx, 1);
      return { message: "Message deleted successfully" };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete message", 500);
    }
  }
}
