import { Router } from "express";
import { AuthRoute } from "../module/Auth/auth.route.js";

const router = Router();

router.use("/auth", AuthRoute);

export const IndexRoute = router;