import { Router } from "express";
import chatbotRoutes from "../modules/chat/chatbot/chatbot.routes";
import chatPersonaRoutes from "../modules/chat/chatPersona/chatPersona.public.routes";
import contactoRoutes from "../modules/contacto/sitioPublico/solicitudes.rutas";
import validadorRoutes from "../modules/validador/validador.routes";

const router = Router();

router.use("/chatbot", chatbotRoutes);
router.use("/chat-persona", chatPersonaRoutes);
router.use("/contacto", contactoRoutes);
router.use("/validador", validadorRoutes);

export default router;
