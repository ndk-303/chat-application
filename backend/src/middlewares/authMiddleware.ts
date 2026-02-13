import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../utils/tokenUtils";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}


export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Missing Authorization header",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      message: "Invalid Authorization format",
    });
  }

  const token = parts[1];

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role ?? 'USER',
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}


