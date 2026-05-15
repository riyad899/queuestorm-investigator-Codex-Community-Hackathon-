import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICreateServiceCenterPayload,
  ICreateServicePayload,
  IServiceCenterQuery,
} from "./serviceCenter.interface.js";

const getBooleanValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (typeof value !== "string") {
    return undefined;
  }

  if (value.toLowerCase() === "true") {
    return true;
  }

  if (value.toLowerCase() === "false") {
    return false;
  }

  return undefined;
};

export const createService = async (payload: ICreateServicePayload) => {
  const name = payload.name.trim();
  const icon = payload.icon?.trim() || undefined;

  const existing = await prisma.service.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new AppError("Service already exists", status.CONFLICT);
  }

  return prisma.service.create({
    data: {
      name,
      icon,
    },
  });
};

export const getServices = async () => {
  return prisma.service.findMany({
    orderBy: { name: "asc" },
  });
};

export const createServiceCenter = async (payload: ICreateServiceCenterPayload) => {
  const serviceIds = [...new Set(payload.services)];

  const slug = payload.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new AppError("Slug is required", status.BAD_REQUEST);
  }

  const existingSlug = await prisma.serviceCenter.findUnique({ where: { slug } });
  if (existingSlug) {
    throw new AppError("Service center slug already exists", status.CONFLICT);
  }

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true },
  });

  if (services.length !== serviceIds.length) {
    throw new AppError("One or more services were not found", status.BAD_REQUEST);
  }

  return prisma.serviceCenter.create({
    data: {
      name: payload.name.trim(),
      slug,
      division: payload.division.trim(),
      address: payload.address.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim(),
      mapLink: payload.mapLink?.trim(),
      isFeatured: payload.isFeatured ?? false,
      openTime: payload.openTime.trim(),
      closeTime: payload.closeTime.trim(),
      centers: {
        create: serviceIds.map((serviceId) => ({
          serviceId,
        })),
      },
    },
    include: {
      centers: {
        include: {
          service: true,
        },
      },
    },
  });
};

export const getServiceCenters = async (query: IServiceCenterQuery) => {
  const division = typeof query.division === "string" ? query.division.trim() : undefined;
  const search = typeof query.search === "string" ? query.search.trim() : undefined;
  const service = typeof query.service === "string" ? query.service.trim() : undefined;
  const featured = getBooleanValue(query.featured);

  const serviceNamesToMatch = service
    ? [...new Set([service, service.replace(/-/g, " ")].map((s) => s.trim()).filter(Boolean))]
    : [];

  const centers = await prisma.serviceCenter.findMany({
    where: {
      AND: [
        division ? { division } : {},
        search
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
        featured !== undefined ? { isFeatured: featured } : {},
        serviceNamesToMatch.length
          ? {
              centers: {
                some: {
                  service: {
                    OR: serviceNamesToMatch.map((serviceName) => ({
                      name: {
                        equals: serviceName,
                        mode: "insensitive",
                      },
                    })),
                  },
                },
              },
            }
          : {},
      ],
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: {
      centers: {
        include: {
          service: true,
        },
      },
    },
  });

  return centers.map((center) => ({
    name: center.name,
    division: center.division,
    isFeatured: center.isFeatured,
    openTime: center.openTime,
    closeTime: center.closeTime,
    services: center.centers.map((c) => c.service.name),
  }));
};
