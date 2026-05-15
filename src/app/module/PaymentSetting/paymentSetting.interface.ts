export interface IPaymentMethodSettingInput {
  key: string;
  name: string;
  isActive?: boolean;
  accountNumber?: string;
  description?: string;
  qrCodeUrl?: string;
}

export interface IDeliveryMethodSettingInput {
  key: string;
  name: string;
  fee?: number;
  isActive?: boolean;
}

export interface IUpsertPaymentSettingPayload {
  topMessage?: string;
  paymentMethods?: IPaymentMethodSettingInput[];
  deliveryMethods?: IDeliveryMethodSettingInput[];
}
