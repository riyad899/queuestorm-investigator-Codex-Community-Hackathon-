import { Router } from "express";
import { StaffController } from "./staff.controller.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { createStaffZodSchema, updateStaffZodSchema } from "./staff.validation.js";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { Role } from "@prisma/client";

const router = Router();

router.post(
  "/create",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateZodSchema(createStaffZodSchema),
  StaffController.createStaff
);
router.get("/get-all", StaffController.getAllStaff);
router.get("/get-staff/:id", StaffController.getStaffById);
router.delete(
  "/delete/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StaffController.deleteStaff
);
router.patch(
  "/update/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateZodSchema(updateStaffZodSchema),
  StaffController.updateStaff
);

export const StaffRoute = router;
