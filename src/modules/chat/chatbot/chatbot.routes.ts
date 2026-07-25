import { Router } from "express";
import { responderMensajeChatbotController } from "./chatbot.controller";

const router = Router();

router.post("/mensaje", responderMensajeChatbotController);

export default router;
