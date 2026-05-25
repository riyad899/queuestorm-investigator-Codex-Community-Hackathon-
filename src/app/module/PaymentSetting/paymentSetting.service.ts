import { prisma } from "../../lib/prisma.js";
import { IUpsertPaymentSettingPayload } from "./paymentSetting.interface.js";

const normalizeOptionalString = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const getLatestPaymentSetting = async () => {
  return prisma.paymentSetting.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      paymentMethods: { orderBy: { createdAt: "asc" } },
      deliveryMethods: { orderBy: { createdAt: "asc" } },
    },
  });
};

export const upsertPaymentSetting = async (payload: IUpsertPaymentSettingPayload) => {
  const existing = await prisma.paymentSetting.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!existing) {
    return prisma.paymentSetting.create({
      data: {
        topMessage: normalizeOptionalString(payload.topMessage),
        paymentMethods: payload.paymentMethods
          ? {
              create: payload.paymentMethods.map((m) => ({
                key: m.key.trim(),
                name: m.name.trim(),
                isActive: m.isActive ?? true,
                transactionIdRequired: m.transactionIdRequired ?? false,
                accountNumber: normalizeOptionalString(m.accountNumber),
                description: normalizeOptionalString(m.description),
                qrCodeUrl: normalizeOptionalString(m.qrCodeUrl),
              })),
            }
          : undefined,
        deliveryMethods: payload.deliveryMethods
          ? {
              create: payload.deliveryMethods.map((d) => ({
                key: d.key.trim(),
                name: d.name.trim(),
                fee: d.fee ?? 0,
                isActive: d.isActive ?? true,
              })),
            }
          : undefined,
      },
      include: {
        paymentMethods: true,
        deliveryMethods: true,
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.paymentSetting.update({
      where: { id: existing.id },
      data: {
        ...(payload.topMessage !== undefined
          ? { topMessage: normalizeOptionalString(payload.topMessage) }
          : {}),
      },
    });

    if (payload.paymentMethods) {
      await tx.paymentMethodSetting.deleteMany({ where: { paymentSettingId: existing.id } });
      if (payload.paymentMethods.length) {
        await tx.paymentMethodSetting.createMany({
          data: payload.paymentMethods.map((m) => ({
            paymentSettingId: existing.id,
            key: m.key.trim(),
            name: m.name.trim(),
            isActive: m.isActive ?? true,
            transactionIdRequired: m.transactionIdRequired ?? false,
            accountNumber: normalizeOptionalString(m.accountNumber),
            description: normalizeOptionalString(m.description),
            qrCodeUrl: normalizeOptionalString(m.qrCodeUrl),
          })),
        });
      }
    }

    if (payload.deliveryMethods) {
      await tx.deliveryMethodSetting.deleteMany({ where: { paymentSettingId: existing.id } });
      if (payload.deliveryMethods.length) {
        await tx.deliveryMethodSetting.createMany({
          data: payload.deliveryMethods.map((d) => ({
            paymentSettingId: existing.id,
            key: d.key.trim(),
            name: d.name.trim(),
            fee: d.fee ?? 0,
            isActive: d.isActive ?? true,
          })),
        });
      }
    }

    return tx.paymentSetting.findUnique({
      where: { id: updated.id },
      include: {
        paymentMethods: { orderBy: { createdAt: "asc" } },
        deliveryMethods: { orderBy: { createdAt: "asc" } },
      },
    });
  });
};

export const getDeliveryFeeByKey = async (deliveryMethodKey: string | undefined) => {
  if (!deliveryMethodKey) {
    return 0;
  }

  const setting = await prisma.paymentSetting.findFirst({
    orderBy: { createdAt: "desc" },
    include: { deliveryMethods: true },
  });

  if (!setting) {
    return 0;
  }

  const method = setting.deliveryMethods.find(
    (m) => m.isActive && m.key.toLowerCase() === deliveryMethodKey.toLowerCase(),
  );

  return method?.fee ?? 0;
};

export const getPaymentMethodByKey = async (paymentMethodKey: string | undefined) => {
  if (!paymentMethodKey) {
    return undefined;
  }

  const setting = await prisma.paymentSetting.findFirst({
    orderBy: { createdAt: "desc" },
    include: { paymentMethods: true },
  });

  if (!setting) {
    return undefined;
  }

  return setting.paymentMethods.find(
    (m) => m.isActive && m.key.toLowerCase() === paymentMethodKey.toLowerCase(),
  );
};
