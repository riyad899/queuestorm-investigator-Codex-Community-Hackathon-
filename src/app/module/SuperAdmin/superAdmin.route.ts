import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { SuperAdminController } from "./superAdmin.controller.js";
import { createAdminZodSchema, updateAdminZodSchema } from "./superAdmin.validation.js";

const router = Router();

router.post(
  "/admins",
  checkAuth(Role.SUPER_ADMIN),
  validateZodSchema(createAdminZodSchema),
  SuperAdminController.createAdmin,
);

router.get("/admins", checkAuth(Role.SUPER_ADMIN), SuperAdminController.getAllAdmins);
router.get("/admins/:id", checkAuth(Role.SUPER_ADMIN), SuperAdminController.getAdminById);

router.patch(
  "/admins/:id",
  checkAuth(Role.SUPER_ADMIN),
  validateZodSchema(updateAdminZodSchema),
  SuperAdminController.updateAdmin,
);

router.delete(
  "/admins/:id",
  checkAuth(Role.SUPER_ADMIN),
  SuperAdminController.deleteAdmin,
);

export const SuperAdminRoute = router;
