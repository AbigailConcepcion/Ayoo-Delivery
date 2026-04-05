import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import winston from 'winston';

// declare process when Node types are unavailable
declare const process: any;

// In a production environment, this MUST be set via environment variables.
// If not set, the server should fail to start.
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: any;
}

export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Structured Logger for auth module
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: object) {
  if (!JWT_SECRET) {
    logger.error('JWT_SECRET is not defined. Cannot generate token.');
    throw new Error('Server configuration error: JWT_SECRET is missing.');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  if (!JWT_SECRET) {
    logger.error('JWT_SECRET is not defined. Cannot verify token.');
    throw new Error('Server configuration error: JWT_SECRET is missing.');
  }
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  try {
    const decoded = verifyToken(token);
    req.user = decoded as any;
    next();
  } catch (err) {
    logger.warn('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
