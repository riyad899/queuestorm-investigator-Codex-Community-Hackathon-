export interface ICreateLatestOfferPayload {
  title: string;
  description?: string;
  offerStartAt: string | Date;
  offerEndAt: string | Date;
  isActive?: boolean;
}

export interface IUpdateLatestOfferPayload {
  title?: string;
  description?: string | null;
  offerStartAt?: string | Date;
  offerEndAt?: string | Date;
  isActive?: boolean;
}
