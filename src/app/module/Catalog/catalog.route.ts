import { Router } from "express";
import { CatalogController } from "./catalog.controller.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import {
  createCategoryZodSchema,
  createCategoryBulkZodSchema,
  updateCategoryZodSchema,
  createProductZodSchema,
  createSpecificationFieldZodSchema,
  createSpecificationGroupZodSchema,
  createSubCategoryZodSchema,
  updateProductZodSchema,
} from "./catalog.validation.js";

const router = Router();

router.post("/category", validateZodSchema(createCategoryZodSchema), CatalogController.createCategory);
router.post(
  "/category/bulk",
  validateZodSchema(createCategoryBulkZodSchema),
  CatalogController.createCategoryBulk,
);
router.get("/category", CatalogController.getCategories);
router.patch("/category/:id", validateZodSchema(updateCategoryZodSchema), CatalogController.updateCategory);
router.delete("/category/:id", CatalogController.deleteCategory);
router.put("/category/:id/feature", CatalogController.featureCategory);
router.put("/category/:id/unfeature", CatalogController.unfeatureCategory);

router.post("/subcategory", validateZodSchema(createSubCategoryZodSchema), CatalogController.createSubCategory);
router.get("/subcategory", CatalogController.getSubCategories);
router.get("/subcategory/:id", CatalogController.getSubCategoryById);

router.post("/spec-group", validateZodSchema(createSpecificationGroupZodSchema), CatalogController.createSpecificationGroup);
router.post("/spec-field", validateZodSchema(createSpecificationFieldZodSchema), CatalogController.createSpecificationField);
router.get("/spec-group", CatalogController.getSpecificationGroups);
router.get("/spec-field", CatalogController.getSpecificationFields);
router.get("/specifications", CatalogController.getSpecifications);

router.post("/product", validateZodSchema(createProductZodSchema), CatalogController.createProduct);
router.get("/product", CatalogController.getProducts);
router.get("/product/featured", CatalogController.getFeaturedProducts);
router.get("/product/suggestions", CatalogController.getProductSuggestions);
router.get("/product/recommendations", CatalogController.getRecommendedProducts);
router.get("/product/:id", CatalogController.getProductById);
router.patch("/product/:id", validateZodSchema(updateProductZodSchema), CatalogController.updateProduct);
router.delete("/product/:id", CatalogController.deleteProduct);
router.put("/product/:id/feature", CatalogController.featureProduct);
router.put("/product/:id/unfeature", CatalogController.unfeatureProduct);

router.get("/filter-options", CatalogController.getFilterOptions);
router.get("/field-options/:fieldId", CatalogController.getFieldOptions);
router.get("/product-count", CatalogController.getFilteredProductCount);

export const CatalogRoute = router;