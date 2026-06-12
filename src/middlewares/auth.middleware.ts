import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
}

export interface AuthRequest extends Request {
  usuario?: JwtPayload;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {

      res.status(401).json({
        ok: false,
        message: "Token no proporcionado"
      });

      return;
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {

      res.status(401).json({
        ok: false,
        message: "Formato de token inválido"
      });

      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {

      res.status(500).json({
        ok: false,
        message: "JWT_SECRET no configurado"
      });

      return;
    }

    const payload = jwt.verify(token, secret) as JwtPayload;

    req.usuario = payload;

    next();

  } catch (error: unknown) {

    if (error instanceof jwt.TokenExpiredError) {

      res.status(401).json({
        ok: false,
        message: "Token expirado"
      });

      return;
    }

    res.status(401).json({
      ok: false,
      message: "Token inválido"
    });
  }
};