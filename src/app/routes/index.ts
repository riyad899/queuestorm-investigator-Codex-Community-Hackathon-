import { Router } from 'express';
import { AuthRoute } from '../module/Auth/auth.route.js';
import { AdminRoute } from '../module/admin/admin.route.js';
import { LogoRoute } from '../module/Logo/logo.route.js';
import { CustomerManagementRoute } from '../module/CustomerManagement/customerManagement.route.js';
import { HomeSettingRoute } from '../module/HomeSetting/homeSetting.route.js';
import { StaffRoute } from '../module/Staff/staff.route.js';
import { CatalogRoute } from '../module/Catalog/catalog.route.js';
import { BrandRoute } from '../module/Brand/brand.route.js';
import { BlogRoute } from '../module/Blog/blog.route.js';
import { CouponRoute } from '../module/Coupon/coupon.route.js';
import { ServiceCenterRoute } from '../module/ServiceCenter/serviceCenter.route.js';
import { JobRoute } from '../module/Job/job.route.js';
import { FooterSettingRoute } from '../module/FooterSetting/footerSetting.route.js';
import { IconsRoute } from '../module/Icons/icons.route.js';

const router = Router();

router.use("/auth", AuthRoute);
router.use("/admin", AdminRoute);
router.use("/logo", LogoRoute);
router.use("/home-setting", HomeSettingRoute);
router.use("/customer-management", CustomerManagementRoute);
router.use("/staff", StaffRoute);
router.use("/", CatalogRoute);
router.use("/brand", BrandRoute);
router.use("/", BlogRoute);
router.use("/", CouponRoute);
router.use("/", ServiceCenterRoute);
router.use("/", JobRoute);
router.use("/footer-setting", FooterSettingRoute);
router.use("/icons", IconsRoute);

export const IndexRoute = router;