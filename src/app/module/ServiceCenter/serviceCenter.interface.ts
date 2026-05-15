export interface ICreateServicePayload {
  name: string;
  icon?: string;
}

export interface ICreateServiceCenterPayload {
  name: string;
  slug: string;
  division: string;
  address: string;
  phone: string;
  email?: string;

  mapLink?: string;
  isFeatured?: boolean;
  openTime: string;
  closeTime: string;
  services: string[];
}

export interface IServiceCenterQuery {
  division?: string;
  search?: string;
  service?: string;
  featured?: string;
}
