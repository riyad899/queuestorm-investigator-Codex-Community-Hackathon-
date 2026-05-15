import { Router } from 'express';
import { validateZodSchema } from '../../../middleware/validateReq.js';
import { createLogoSchema, updateLogoSchema } from './logo.validation.js';
import * as logoController from './logo.controller.js';

const router = Router();

router.post('/', validateZodSchema(createLogoSchema), logoController.createLogo);
router.get('/', logoController.getAllLogos);
router.put('/:id', validateZodSchema(updateLogoSchema), logoController.updateLogo);
router.get('/latest', logoController.getLatestLogo);
router.get('/:id', logoController.getLogoById);
router.delete('/:id', logoController.deleteLogo);

export const LogoRoute = router;
