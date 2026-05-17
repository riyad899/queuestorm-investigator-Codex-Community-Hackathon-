import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { HomeSettingService } from "./homeSetting.service.js";

const getBannerSetting = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeSettingService.getBannerSetting();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Banner setting fetched successfully",
    data: result,
  });
});

const upsertBannerSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.upsertBannerSetting(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Banner setting saved successfully",
    data: result,
  });
});

const createBannerSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.createBannerSetting(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Banner setting created successfully",
    data: result,
  });
});

const createLogoSliderItem = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.createLogoSliderItem(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Logo slider item created successfully",
    data: result,
  });
});

const getLogoSliderItems = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeSettingService.getLogoSliderItems();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Logo slider items fetched successfully",
    data: result,
  });
});

const updateLogoSliderItem = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.updateLogoSliderItem(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Logo slider item updated successfully",
    data: result,
  });
});

const deleteLogoSliderItem = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.deleteLogoSliderItem(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Logo slider item deleted successfully",
    data: result,
  });
});

const createTheme = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.createTheme(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Theme created successfully",
    data: result,
  });
});

const getThemes = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeSettingService.getThemes();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Themes fetched successfully",
    data: result,
  });
});

const updateTheme = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.updateTheme(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Theme updated successfully",
    data: result,
  });
});

const activateTheme = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.activateTheme(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Theme activated successfully",
    data: result,
  });
});

const getActiveTheme = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeSettingService.getActiveTheme();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Active theme fetched successfully",
    data: result,
  });
});

const setFeaturedCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.setFeaturedCategories(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Featured categories updated successfully",
    data: result,
  });
});

const getFeaturedCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeSettingService.getFeaturedCategories();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Featured categories fetched successfully",
    data: result,
  });
});

const setPopularCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.setPopularCategories(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Popular categories updated successfully",
    data: result,
  });
});

const getPopularCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeSettingService.getPopularCategories();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Popular categories fetched successfully",
    data: result,
  });
});

const addPopularCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.addPopularCategory(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Popular category added successfully",
    data: result,
  });
});

const updatePopularCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.updatePopularCategory(String(req.params.categoryId), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Popular category updated successfully",
    data: result,
  });
});

const deletePopularCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.deletePopularCategory(String(req.params.categoryId));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Popular category removed successfully",
    data: result,
  });
});

const setRecommendedCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.setRecommendedCategories(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Recommended categories updated successfully",
    data: result,
  });
});

const getRecommendedCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeSettingService.getRecommendedCategories();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Recommended categories fetched successfully",
    data: result,
  });
});

const createTestimonial = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.createTestimonial(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Testimonial created successfully",
    data: result,
  });
});

const getTestimonials = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeSettingService.getTestimonials();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Testimonials fetched successfully",
    data: result,
  });
});

const updateTestimonial = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.updateTestimonial(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Testimonial updated successfully",
    data: result,
  });
});

const deleteTestimonial = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeSettingService.deleteTestimonial(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Testimonial deleted successfully",
    data: result,
  });
});

export const HomeSettingController = {
  getBannerSetting,
  createBannerSetting,
  upsertBannerSetting,
  createLogoSliderItem,
  getLogoSliderItems,
  updateLogoSliderItem,
  deleteLogoSliderItem,
  createTheme,
  getThemes,
  updateTheme,
  activateTheme,
  getActiveTheme,
  setFeaturedCategories,
  getFeaturedCategories,
  setPopularCategories,
  getPopularCategories,
  addPopularCategory,
  updatePopularCategory,
  deletePopularCategory,
  setRecommendedCategories,
  getRecommendedCategories,
  createTestimonial,
  getTestimonials,
  updateTestimonial,
  deleteTestimonial,
};
