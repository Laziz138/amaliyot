import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

interface TokenPayload {
  userId: number
}

declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ message: "Autentifikatsiya talab qilinadi" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret") as TokenPayload
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ message: "Yaroqsiz token" })
  }
}
