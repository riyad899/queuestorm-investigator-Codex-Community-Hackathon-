import { DiscountType } from "@prisma/client";

export interface ICreateCouponPayload {
  code: string;
  title?: string;
  description?: string;

  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;

  minOrderAmount?: number;
  usageLimit?: number;

  startsAt?: string | Date;
  endsAt?: string | Date;

  isActive?: boolean;

  productIds?: string[];
}

export interface IUpdateCouponPayload {
  code?: string;
  title?: string | null;
  description?: string | null;

  discountType?: DiscountType;
  discountValue?: number;
  maxDiscount?: number | null;

  minOrderAmount?: number | null;
  usageLimit?: number | null;

  startsAt?: string | Date | null;
  endsAt?: string | Date | null;

  isActive?: boolean;

  productIds?: string[];
}

export interface ICouponValidatePayload {
  code: string;
  items: { productId: string; quantity: number }[];
  deliveryMethodKey?: string;
}
