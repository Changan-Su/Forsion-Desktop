import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string | number; role: string };
    req.userId = String(decoded.userId); // 确保是字符串类型
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

