export interface ICreateCategoryPayload {
  name: string;
  isFeatured?: boolean;
  icon?: string;
  image?: string;
}

export type ICreateCategoryBulkPayload = ICreateCategoryPayload[];

export interface IUpdateCategoryPayload {
  name?: string;
  isFeatured?: boolean;
  icon?: string | null;
  image?: string | null;
}

export interface ICreateSubCategoryPayload {
  name: string;
  categoryId: string;
}

export interface ICreateSpecificationGroupPayload {
  name: string;
  subCategoryId: string;
}

export interface ICreateSpecificationFieldPayload {
  name: string;
  groupId: string;
  type?: string;
  options?: string[];
}

export interface ICreateProductSpecificationPayload {
  fieldId: string;
  value: string;
}

export interface ICreateProductPayload {
  title: string;
  price: number;
  discountPrice?: number;
  quantity?: number;
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  brandId: string;
  images?: string[];
  isFeatured?: boolean;
  subCategoryId: string;
  specifications?: ICreateProductSpecificationPayload[];
}

export interface IUpdateProductPayload {
  title?: string;
  price?: number;
  discountPrice?: number | null;
  quantity?: number;
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
  brandId?: string | null;
  images?: string[];
  isFeatured?: boolean;
  subCategoryId?: string;
  specifications?: ICreateProductSpecificationPayload[];
}

export interface ICatalogFilterQuery {
  subcategoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  priceMin?: string;
  priceMax?: string;
  page?: string;
  limit?: string;
  [key: string]: string | string[] | undefined;
}