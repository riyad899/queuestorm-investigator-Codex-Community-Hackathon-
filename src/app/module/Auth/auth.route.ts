import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { checkAuth } from "../../../middleware/checkAuth.js";
import {
	forgetPasswordZodSchema,
	loginUserZodSchema,
	resetPasswordZodSchema,
	registerCustomerZodSchema,
	updateCustomerZodSchema,
	verifyEmailZodSchema,
} from "./auth.validation.js";

const router = Router();

router.post("/register", validateZodSchema(registerCustomerZodSchema), AuthController.register);
router.post("/login", validateZodSchema(loginUserZodSchema), AuthController.LoginUser);
router.get("/get-me", checkAuth(), AuthController.getMe);
router.get("/customer/profile", checkAuth(), AuthController.getMyCustomerProfile);
router.patch("/customer/:id", checkAuth(), validateZodSchema(updateCustomerZodSchema), AuthController.updateCustomer);
router.get("/role", checkAuth(), AuthController.getRole);
router.post("/refresh-token", AuthController.getNewToken);
router.post("/change-password", AuthController.changePassword);
router.post("/logout", AuthController.logoutUser);
router.post("/verify-email", validateZodSchema(verifyEmailZodSchema), AuthController.verifyEmail);
router.post("/forget-password", validateZodSchema(forgetPasswordZodSchema), AuthController.forgetPassword);
router.post("/reset-password", validateZodSchema(resetPasswordZodSchema), AuthController.resetPassword);
router.post("/request-email-otp", validateZodSchema(forgetPasswordZodSchema), AuthController.requestEmailVerificationOTP);
router.post("/request-password-reset-otp", validateZodSchema(forgetPasswordZodSchema), AuthController.requestPasswordResetOTP);

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);
export const AuthRoute = router;