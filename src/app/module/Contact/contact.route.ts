import { Router } from "express";
import { ContactController } from "./contact.controller.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { createContactSchema } from "./contact.validation.js";

const router = Router();

router.post("/contact", validateZodSchema(createContactSchema), ContactController.createMessage);
router.get("/contact", ContactController.getMessages);
router.get("/contact/:id", ContactController.getMessageById);
router.delete("/contact/:id", ContactController.deleteMessage);

export const ContactRoute = router;
