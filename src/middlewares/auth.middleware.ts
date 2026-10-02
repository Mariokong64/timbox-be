import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { consultarCierreSesion } from "../modules/autenticacion/auth.repository";
import { obtenerPermisosUsuario } from "../modules/usuarios/usuarios.repository";
import type { PermisoPantalla } from "../modules/usuarios/usuarios.types";

export interface JwtPayload {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  fotoPerfil: string | null;
}

export interface AuthRequest extends Request {
  usuario?: JwtPayload;
  permisos?: PermisoPantalla[];
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        ok: false,
        message: "Token no proporcionado",
      });

      return;
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      res.status(401).json({
        ok: false,
        message: "Formato de token inválido",
      });

      return;
    }

    if (!env.jwtSecret) {
      res.status(500).json({
        ok: false,
        message: "JWT_SECRET no configurado",
      });

      return;
    }

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    req.usuario = payload;

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        ok: false,
        message: "Token expirado",
      });

      return;
    }

    res.status(401).json({
      ok: false,
      message: "Token inválido",
    });
  }
};

export const cargarSesionPrivadaMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
      res.status(401).json({ ok: false, message: "Sesión no válida." });
      return;
    }

    const forzarCierreSesion = await consultarCierreSesion(usuarioId);
    if (forzarCierreSesion === null || forzarCierreSesion) {
      res.status(401).json({ ok: false, message: "Debes iniciar sesión nuevamente." });
      return;
    }

    req.permisos = await obtenerPermisosUsuario(usuarioId);
    next();
  } catch (error) {
    console.error("Error al consultar la sesión del usuario.", error);
    res.status(500).json({ ok: false, message: "No se pudo validar la sesión." });
  }
};
