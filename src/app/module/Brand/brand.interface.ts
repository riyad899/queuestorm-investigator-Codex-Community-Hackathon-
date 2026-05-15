export interface ICreateBrandPayload {
  name: string;
  slug: string;
  logo?: string | null;
  country?: string | null;
  slogan?: string | null;
  description?: string | null;
}

export interface IAssignBrandCategoryPayload {
  brandId: string;
  categoryId: string;
}

export interface IBrandQuery {
  category?: string;
  search?: string;
}
