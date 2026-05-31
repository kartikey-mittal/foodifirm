import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export async function authenticateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
