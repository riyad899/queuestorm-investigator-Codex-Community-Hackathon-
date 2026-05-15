import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICreateDepartmentPayload,
  ICreateJobApplicationPayload,
  ICreateJobPayload,
  IJobQuery,
  IUpdateJobPayload,
} from "./job.interface.js";

const createDepartment = async (payload: ICreateDepartmentPayload) => {
  const name = payload.name.trim();

  const existing = await prisma.department.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new AppError("Department already exists", status.CONFLICT);
  }

  return prisma.department.create({
    data: { name },
  });
};

const getDepartments = async () => {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
  });
};

const createJob = async (payload: ICreateJobPayload) => {
  const department = await prisma.department.findUnique({
    where: { id: payload.departmentId },
  });

  if (!department) {
    throw new AppError("Department not found", status.NOT_FOUND);
  }

  return prisma.job.create({
    data: {
      title: payload.title.trim(),
      departmentId: payload.departmentId,
      jobType: payload.jobType.trim(),
      location: payload.location.trim(),
      experience: payload.experience.trim(),
      deadline: new Date(payload.deadline),
      description: payload.description?.trim(),
    },
    include: {
      department: true,
    },
  });
};

const getJobs = async (query: IJobQuery) => {
  const department = typeof query.department === "string" ? query.department.trim() : undefined;
  const search = typeof query.search === "string" ? query.search.trim() : undefined;

  return prisma.job.findMany({
    where: {
      AND: [
        department
          ? {
              department: {
                name: department,
              },
            }
          : {},
        search
          ? {
              title: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
        { isActive: true },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      department: true,
    },
  });
};

const getJobById = async (id: string) => {
  const job = await prisma.job.findUnique({
    where: { id },
    include: { department: true },
  });

  if (!job) {
    throw new AppError("Job not found", status.NOT_FOUND);
  }

  return job;
};

const updateJob = async (id: string, payload: IUpdateJobPayload) => {
  const existing = await prisma.job.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Job not found", status.NOT_FOUND);
  }

  if (payload.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: payload.departmentId } });
    if (!department) {
      throw new AppError("Department not found", status.NOT_FOUND);
    }
  }

  return prisma.job.update({
    where: { id },
    data: {
      ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
      ...(payload.departmentId !== undefined ? { departmentId: payload.departmentId } : {}),
      ...(payload.jobType !== undefined ? { jobType: payload.jobType.trim() } : {}),
      ...(payload.location !== undefined ? { location: payload.location.trim() } : {}),
      ...(payload.experience !== undefined ? { experience: payload.experience.trim() } : {}),
      ...(payload.deadline !== undefined ? { deadline: new Date(payload.deadline) } : {}),
      ...(payload.description !== undefined ? { description: payload.description?.trim() ?? null } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
    include: { department: true },
  });
};

const deleteJob = async (id: string) => {
  const existing = await prisma.job.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Job not found", status.NOT_FOUND);
  }

  await prisma.job.delete({ where: { id } });

  return { deleted: true, id };
};

const createJobApplication = async (payload: ICreateJobApplicationPayload) => {
  const job = await prisma.job.findUnique({ where: { id: payload.jobId } });

  if (!job) {
    throw new AppError("Job not found", status.NOT_FOUND);
  }

  return prisma.jobApplication.create({
    data: {
      jobId: payload.jobId,
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      resumeUrl: payload.resumeUrl.trim(),
    },
    include: {
      job: {
        include: { department: true },
      },
    },
  });
};

const getApplications = async () => {
  return prisma.jobApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: { department: true },
      },
    },
  });
};

export const JobService = {
  createDepartment,
  getDepartments,
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  createJobApplication,
  getApplications,
};
