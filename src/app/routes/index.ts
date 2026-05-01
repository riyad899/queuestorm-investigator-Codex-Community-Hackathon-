import { Router } from 'express';
import { AuthRoute } from '../module/Auth/auth.route.js';
import { AdminRoute } from '../module/admin/admin.route.js';
import { StaffRoute } from '../module/Staff/staff.route.js';

const router = Router();

router.use("/auth", AuthRoute);
router.use("/admin", AdminRoute);
router.use("/staff", StaffRoute);

export const IndexRoute = router;