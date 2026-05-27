import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { AdminController } from "./admin.controller.js";
import { updateAdminZodSchema, updateAdminRoleZodSchema } from "./admin.validation.js";

const router = Router();

router.get("/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminController.getAllAdmins);
router.get("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminController.getAdminById);
router.patch("/:id",
    checkAuth(Role.SUPER_ADMIN),
    validateZodSchema(updateAdminZodSchema), AdminController.updateAdmin);
router.patch(
    "/:id/role",
    checkAuth(Role.SUPER_ADMIN),
    validateZodSchema(updateAdminRoleZodSchema),
    AdminController.changeUserRole,
);
router.delete("/:id",
    checkAuth(Role.SUPER_ADMIN),
    AdminController.deleteAdmin);

export const AdminRoute = router;