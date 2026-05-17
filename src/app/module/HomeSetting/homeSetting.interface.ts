export interface IHomeBannerSettingPayload {
  middleBanner: string[];
  sideBanner?: string[];
  recommendedBanners?: string[];
}

export interface IHomeLogoSliderItemPayload {
  name: string;
  logoUrl: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface IHomeLogoSliderItemUpdatePayload {
  name?: string;
  logoUrl?: string;
  linkUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ISiteThemePayload {
  name: string;
  colorPrimaryBg: string;
  colorSecondaryCard: string;
  colorButton: string;
  colorIcon: string;
  colorIconMuted: string;
  colorBar: string;
  colorFont: string;
  colorBorderShade: string;
  isActive?: boolean;
}

export interface ISiteThemeUpdatePayload {
  name?: string;
  colorPrimaryBg?: string;
  colorSecondaryCard?: string;
  colorButton?: string;
  colorIcon?: string;
  colorIconMuted?: string;
  colorBar?: string;
  colorFont?: string;
  colorBorderShade?: string;
  isActive?: boolean;
}

export interface IFeaturedCategoryPayload {
  categoryIds: string[];
}

export interface ICategoryOrderItem {
  categoryId: string;
  sortOrder?: number;
}

export interface IPopularCategoryPayload {
  items: ICategoryOrderItem[];
}

export interface IPopularCategoryItemPayload {
  categoryId: string;
  sortOrder?: number;
}

export interface IPopularCategoryUpdatePayload {
  sortOrder?: number;
}

export interface IRecommendedCategoryPayload {
  items: ICategoryOrderItem[];
}

export interface ITestimonialPayload {
  description: string;
  userImage: string;
  userName: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ITestimonialUpdatePayload {
  description?: string;
  userImage?: string;
  userName?: string;
  sortOrder?: number;
  isActive?: boolean;
}
