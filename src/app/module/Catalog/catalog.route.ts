import { Router } from "express";
import { CatalogController } from "./catalog.controller.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import {
  createCategoryZodSchema,
  createCategoryBulkZodSchema,
  updateCategoryZodSchema,
  createProductZodSchema,
  createProductBulkZodSchema,
  createSpecificationFieldZodSchema,
  createSpecificationFieldBulkZodSchema,
  setSpecificationFieldFeatureZodSchema,
  createSpecificationGroupZodSchema,
  createSpecificationGroupBulkZodSchema,
  createSubCategoryZodSchema,
  updateProductZodSchema,
  updateProductSpecificationZodSchema,
  updateProductSpecificationsBulkZodSchema,
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
router.post(
  "/spec-group/bulk",
  validateZodSchema(createSpecificationGroupBulkZodSchema),
  CatalogController.createSpecificationGroupBulk,
);
router.get("/spec-group/summary", CatalogController.getSpecificationGroupsSummary);
router.get("/spec-group/with-fields", CatalogController.getSpecificationGroupsWithFields);
router.get("/spec-group/:id", CatalogController.getSpecificationGroupById);
router.get("/hierarchy", CatalogController.getCatalogHierarchy);
router.post("/spec-field", validateZodSchema(createSpecificationFieldZodSchema), CatalogController.createSpecificationField);
router.post(
  "/spec-field/bulk",
  validateZodSchema(createSpecificationFieldBulkZodSchema),
  CatalogController.createSpecificationFieldBulk,
);
router.get("/spec-group", CatalogController.getSpecificationGroups);
router.get("/spec-field", CatalogController.getSpecificationFields);
router.get("/specifications", CatalogController.getSpecifications);
router.get("/spec-field/subcategory/:id/featured", CatalogController.getFeaturedSpecificationFieldsBySubCategory);

router.put("/spec-field/:id/feature", CatalogController.featureSpecificationField);
router.put("/spec-field/:id/unfeature", CatalogController.unfeatureSpecificationField);
router.put(
  "/spec-field/subcategory/:id/feature",
  validateZodSchema(setSpecificationFieldFeatureZodSchema),
  CatalogController.setSpecificationFieldsFeaturedBySubCategory,
);

router.post("/product/bulk", validateZodSchema(createProductBulkZodSchema), CatalogController.createProductBulk);
router.post("/product", validateZodSchema(createProductZodSchema), CatalogController.createProduct);
router.get("/product", CatalogController.getProducts);
router.get("/product/featured", CatalogController.getFeaturedProducts);
router.get("/product/suggestions", CatalogController.getProductSuggestions);
router.get("/product/recommendations", CatalogController.getRecommendedProducts);
router.get("/product/:id", CatalogController.getProductById);
router.patch("/product/:id", validateZodSchema(updateProductZodSchema), CatalogController.updateProduct);
router.put(
  "/product/:productId/specifications/:specId",
  validateZodSchema(updateProductSpecificationZodSchema),
  CatalogController.updateProductSpecification,
);
router.put(
  "/product/:productId/specifications",
  validateZodSchema(updateProductSpecificationsBulkZodSchema),
  CatalogController.updateProductSpecifications,
);
router.delete("/product/:id", CatalogController.deleteProduct);
router.put("/product/:id/feature", CatalogController.featureProduct);
router.put("/product/:id/unfeature", CatalogController.unfeatureProduct);

router.get("/filter-options", CatalogController.getFilterOptions);
router.get("/field-options/:fieldId", CatalogController.getFieldOptions);
router.get("/product-count", CatalogController.getFilteredProductCount);

export const CatalogRoute = router;