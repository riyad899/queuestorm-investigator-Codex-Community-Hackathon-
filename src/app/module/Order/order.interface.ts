import { DeliveryStatus, PaymentStatus } from "@prisma/client";

export interface IOrderItemInput {
  productId: string;
  quantity: number;
}

export interface ICreateOrderPayload {
  firstName: string;
  lastName: string;
  address: string;
  upazilaThana: string;
  district: string;
  mobile: string;
  email: string;
  comment?: string;

  couponCode?: string;

  paymentMethodKey?: string;
  transactionId?: string;
  deliveryMethodKey?: string;

  items: IOrderItemInput[];
}

export interface IOrderListQuery {
  search?: string;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
}

export interface IUpdateOrderPaymentPayload {
  paymentStatus: PaymentStatus;
}

export interface IUpdateOrderDeliveryPayload {
  deliveryStatus: DeliveryStatus;
}
