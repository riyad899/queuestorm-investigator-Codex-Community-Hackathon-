import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { CatalogService } from "./catalog.service.js";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createCategory(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const createCategoryBulk = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createCategoryBulk(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Categories created successfully",
    data: result,
  });
});

const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await CatalogService.getCategories();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.updateCategory(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.deleteCategory(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

const featureCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.setCategoryFeatured(String(req.params.id), true);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Category marked as featured",
    data: result,
  });
});

const unfeatureCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.setCategoryFeatured(String(req.params.id), false);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Category unmarked as featured",
    data: result,
  });
});

const createSubCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createSubCategory(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Subcategory created successfully",
    data: result,
  });
});

const getSubCategories = catchAsync(async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId as string | undefined;
  const result = await CatalogService.getSubCategories(categoryId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Subcategories fetched successfully",
    data: result,
  });
});

const getSubCategoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.getSubCategoryById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Subcategory fetched successfully",
    data: result,
  });
});

const createSpecificationGroup = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createSpecificationGroup(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Specification group created successfully",
    data: result,
  });
});

const createSpecificationGroupBulk = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createSpecificationGroupBulk(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Specification groups created successfully",
    data: result,
  });
});

const createSpecificationField = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createSpecificationField(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Specification field created successfully",
    data: result,
  });
});

const createSpecificationFieldBulk = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createSpecificationFieldBulk(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Specification fields created successfully",
    data: result,
  });
});

const getSpecificationGroups = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = (req.query.subcategoryId ?? req.query.subCategoryId) as string | undefined;

  const result = await CatalogService.getSpecificationGroups(subcategoryId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specification groups fetched successfully",
    data: result,
  });
});

const getSpecificationGroupsWithFields = catchAsync(async (_req: Request, res: Response) => {
  const result = await CatalogService.getSpecificationGroupsWithFields();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specification groups with fields fetched successfully",
    data: result,
  });
});

const getSpecificationFields = catchAsync(async (req: Request, res: Response) => {
  const groupId = (req.query.groupId ?? req.query.group_id ?? req.query.specGroupId) as string | undefined;
  const subcategoryId = (req.query.subcategoryId ?? req.query.subCategoryId) as string | undefined;

  if (groupId) {
    const result = await CatalogService.getSpecificationFields(groupId);

    if (subcategoryId) {
      const groupIdsInSubcategory = new Set(
        (await CatalogService.getSpecificationGroups(subcategoryId)).data.map((g) => g.id),
      );
      if (!groupIdsInSubcategory.has(groupId)) {
        sendResponse(res, {
          httpStatus: status.BAD_REQUEST,
          success: false,
          message: "groupId does not belong to the provided subcategoryId",
        });
        return;
      }
    }

    sendResponse(res, {
      httpStatus: status.OK,
      success: true,
      message: "Specification fields fetched successfully",
      data: result,
    });
    return;
  }

  if (!subcategoryId) {
    sendResponse(res, {
      httpStatus: status.BAD_REQUEST,
      success: false,
      message: "groupId or subcategoryId query parameter is required",
    });
    return;
  }

  const result = await CatalogService.getSpecificationFieldsBySubCategory(subcategoryId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specification fields fetched successfully",
    data: result,
  });
});

const getSpecificationGroupsSummary = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = (req.query.subcategoryId ?? req.query.subCategoryId) as string | undefined;

  const result = await CatalogService.getSpecificationGroupsSummary(subcategoryId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specification groups summary fetched successfully",
    data: result,
  });
});

const getFeaturedSpecificationFieldsBySubCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.getFeaturedSpecificationFieldsBySubCategory(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Featured specification fields fetched successfully",
    data: result,
  });
});

const featureSpecificationField = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.setSpecificationFieldFeatured(String(req.params.id), true);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specification field marked as featured",
    data: result,
  });
});

const unfeatureSpecificationField = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.setSpecificationFieldFeatured(String(req.params.id), false);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specification field unmarked as featured",
    data: result,
  });
});

const setSpecificationFieldsFeaturedBySubCategory = catchAsync(async (req: Request, res: Response) => {
  const subCategoryId = String(req.params.id);
  const { fieldIds, isFeatured } = req.body as { fieldIds?: string[]; isFeatured: boolean };

  const result = await CatalogService.setSpecificationFieldsFeaturedBySubCategory(subCategoryId, fieldIds, isFeatured);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specification fields updated successfully",
    data: result,
  });
});

const getSpecificationGroupById = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.getSpecificationGroupById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specification group fetched successfully",
    data: result,
  });
});

const getCatalogHierarchy = catchAsync(async (_req: Request, res: Response) => {
  const result = await CatalogService.getCatalogHierarchy();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Catalog hierarchy fetched successfully",
    data: result,
  });
});

const getCategoryDetails = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.getCategoryDetails(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Category details fetched successfully",
    data: result,
  });
});

const getSpecifications = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = (req.query.subcategoryId ?? req.query.subCategoryId) as string | undefined;

  if (!subcategoryId) {
    sendResponse(res, {
      httpStatus: status.BAD_REQUEST,
      success: false,
      message: "subcategoryId query parameter is required",
    });
    return;
  }

  const result = await CatalogService.getSpecifications(subcategoryId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Specifications fetched successfully",
    data: result,
  });
});

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createProduct(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});

const createProductBulk = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.createProductBulk(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Products created successfully",
    data: result,
  });
});

const getProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.getProducts(req.query as Record<string, string | string[] | undefined>);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Products fetched successfully",
    data: result,
  });
});

const getFeaturedProducts = catchAsync(async (_req: Request, res: Response) => {
  const result = await CatalogService.getFeaturedProducts();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Featured products fetched successfully",
    data: result,
  });
});

const getProductSuggestions = catchAsync(async (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const result = await CatalogService.getProductSuggestions(search);

  res.status(status.OK).json(result);
});

const getRecommendedProducts = catchAsync(async (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const limit = Number(req.query.limit ?? 3) || 3;
  const result = await CatalogService.getRecommendedProducts(search, Math.max(1, Math.min(20, limit)));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Recommended products fetched successfully",
    data: result,
  });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.getProductById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Product fetched successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.updateProduct(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

const updateProductSpecification = catchAsync(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);
  const specId = String(req.params.specId);
  const payload = req.body as { fieldId?: string; value?: string };

  const result = await CatalogService.updateProductSpecification(productId, specId, payload);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Product specification updated successfully",
    data: result,
  });
});

const updateProductSpecifications = catchAsync(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);
  const { specifications } = req.body as { specifications: Array<{ id?: string; fieldId: string; value: string }> };

  const result = await CatalogService.updateProductSpecifications(productId, specifications);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Product specifications updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.deleteProduct(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Product deleted successfully",
    data: result,
  });
});

const featureProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.setProductFeatured(String(req.params.id), true);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Product marked as featured",
    data: result,
  });
});

const unfeatureProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.setProductFeatured(String(req.params.id), false);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Product unmarked as featured",
    data: result,
  });
});

const getFilterOptions = catchAsync(async (req: Request, res: Response) => {
  const subcategoryId = req.query.subcategoryId as string | undefined;

  if (!subcategoryId) {
    sendResponse(res, {
      httpStatus: status.BAD_REQUEST,
      success: false,
      message: "subcategoryId query parameter is required",
    });
    return;
  }

  const result = await CatalogService.getFilterOptions(subcategoryId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Filter options fetched successfully",
    data: result,
  });
});

const getFieldOptions = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.getFieldOptions(String(req.params.fieldId));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Field options fetched successfully",
    data: result,
  });
});

const getFilteredProductCount = catchAsync(async (req: Request, res: Response) => {
  const result = await CatalogService.getFilteredProductCount(req.query as Record<string, string | string[] | undefined>);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Filtered product count fetched successfully",
    data: result,
  });
});

export const CatalogController = {
  createCategory,
  createCategoryBulk,
  getCategories,
  updateCategory,
  deleteCategory,
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  createSpecificationGroup,
  createSpecificationGroupBulk,
  createSpecificationField,
  createSpecificationFieldBulk,
  getSpecificationGroupsSummary,
  getSpecificationGroupById,
  getSpecificationGroupsWithFields,
  getCatalogHierarchy,
  getCategoryDetails,
  getSpecificationGroups,
  getSpecificationFields,
  getSpecifications,
  createProduct,
  createProductBulk,
  getProducts,
  getFeaturedProducts,
  getProductSuggestions,
  getProductById,
  getRecommendedProducts,
  updateProduct,
  deleteProduct,
  getFilterOptions,
  getFieldOptions,
  getFilteredProductCount,
  getFeaturedSpecificationFieldsBySubCategory,
  featureSpecificationField,
  unfeatureSpecificationField,
  setSpecificationFieldsFeaturedBySubCategory,
  updateProductSpecification,
  updateProductSpecifications,
  featureCategory,
  unfeatureCategory,
  featureProduct,
  unfeatureProduct,
};