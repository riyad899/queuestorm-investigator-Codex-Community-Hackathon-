import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import * as customerManagementController from "./customerManagement.controller.js";
import {
  updateCustomerRoleZodSchema,
  updateCustomerStatusZodSchema,
} from "./customerManagement.validation.js";

const router = Router();

router.get(
  "/customers",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  customerManagementController.getCustomers,
);

router.get(
  "/customers/latest",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  customerManagementController.getLatestCustomers,
);

router.get(
  "/customers/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  customerManagementController.getCustomerById,
);

router.patch(
  "/customers/:id/status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  validateZodSchema(updateCustomerStatusZodSchema),
  customerManagementController.updateCustomerStatus,
);

router.patch(
  "/customers/:id/role",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  validateZodSchema(updateCustomerRoleZodSchema),
  customerManagementController.updateCustomerRole,
);

export const CustomerManagementRoute = router;
