import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  fotoPerfil: string | null;
}

export interface AuthRequest extends Request {
  usuario?: JwtPayload;
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
