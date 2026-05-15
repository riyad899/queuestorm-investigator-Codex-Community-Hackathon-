import { Router } from 'express';
import { AuthRoute } from '../module/Auth/auth.route.js';
import { AdminRoute } from '../module/admin/admin.route.js';
import { LogoRoute } from '../module/Logo/logo.route.js';
import { CustomerManagementRoute } from '../module/CustomerManagement/customerManagement.route.js';
import { HomeSettingRoute } from '../module/HomeSetting/homeSetting.route.js';
import { StaffRoute } from '../module/Staff/staff.route.js';

const router = Router();

router.use("/auth", AuthRoute);
router.use("/admin", AdminRoute);
router.use("/logo", LogoRoute);
router.use("/home-setting", HomeSettingRoute);
router.use("/customer-management", CustomerManagementRoute);
router.use("/staff", StaffRoute);

export const IndexRoute = router;