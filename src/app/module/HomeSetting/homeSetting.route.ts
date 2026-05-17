import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { HomeSettingController } from "./homeSetting.controller.js";
import {
  createLogoSliderItemZodSchema,
  createSiteThemeZodSchema,
  createTestimonialZodSchema,
  popularCategoryItemZodSchema,
  setFeaturedCategoriesZodSchema,
  setPopularCategoriesZodSchema,
  setRecommendedCategoriesZodSchema,
  updatePopularCategoryZodSchema,
  updateLogoSliderItemZodSchema,
  updateSiteThemeZodSchema,
  updateTestimonialZodSchema,
  upsertHomeBannerSettingZodSchema,
} from "./homeSetting.validation.js";
import { HomeAdSettingRoute } from "./homeAdSetting.route.js";

const router = Router();

router.get("/banner", HomeSettingController.getBannerSetting);
router.post("/banner", validateZodSchema(upsertHomeBannerSettingZodSchema), HomeSettingController.createBannerSetting);
router.put("/banner", validateZodSchema(upsertHomeBannerSettingZodSchema), HomeSettingController.upsertBannerSetting);

router.use("/ads", HomeAdSettingRoute);

router.post("/logo-slider", validateZodSchema(createLogoSliderItemZodSchema), HomeSettingController.createLogoSliderItem);
router.get("/logo-slider", HomeSettingController.getLogoSliderItems);
router.patch("/logo-slider/:id", validateZodSchema(updateLogoSliderItemZodSchema), HomeSettingController.updateLogoSliderItem);
router.delete("/logo-slider/:id", HomeSettingController.deleteLogoSliderItem);

router.post("/theme", validateZodSchema(createSiteThemeZodSchema), HomeSettingController.createTheme);
router.get("/theme", HomeSettingController.getThemes);
router.get("/theme/active", HomeSettingController.getActiveTheme);
router.patch("/theme/:id", validateZodSchema(updateSiteThemeZodSchema), HomeSettingController.updateTheme);
router.patch("/theme/:id/activate", HomeSettingController.activateTheme);

router.get("/featured-categories", HomeSettingController.getFeaturedCategories);
router.patch("/featured-categories", validateZodSchema(setFeaturedCategoriesZodSchema), HomeSettingController.setFeaturedCategories);

router.get("/popular-categories", HomeSettingController.getPopularCategories);
router.post("/popular-categories", validateZodSchema(popularCategoryItemZodSchema), HomeSettingController.addPopularCategory);
router.patch(
  "/popular-categories/:categoryId",
  validateZodSchema(updatePopularCategoryZodSchema),
  HomeSettingController.updatePopularCategory,
);
router.delete("/popular-categories/:categoryId", HomeSettingController.deletePopularCategory);
router.put("/popular-categories", validateZodSchema(setPopularCategoriesZodSchema), HomeSettingController.setPopularCategories);

router.get("/recommended-categories", HomeSettingController.getRecommendedCategories);
router.put("/recommended-categories", validateZodSchema(setRecommendedCategoriesZodSchema), HomeSettingController.setRecommendedCategories);

router.post("/testimonial", validateZodSchema(createTestimonialZodSchema), HomeSettingController.createTestimonial);
router.get("/testimonial", HomeSettingController.getTestimonials);
router.patch("/testimonial/:id", validateZodSchema(updateTestimonialZodSchema), HomeSettingController.updateTestimonial);
router.delete("/testimonial/:id", HomeSettingController.deleteTestimonial);

export const HomeSettingRoute = router;
