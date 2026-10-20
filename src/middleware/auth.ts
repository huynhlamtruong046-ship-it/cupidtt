import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  customUserId?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.customUserId = decodedToken.uid;
    next();
  } catch (error) {
  
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      req.customUserId = decodedToken.uid;
   } catch (error) {
  console.error('Error verifying optional Firebase ID token:', error);
  return _res.status(401).json({
    error: 'Unauthorized: Invalid token'
  });
}
  }
  next();
};

export const ADMIN_EMAILS = ['huynhlamtruong046@gmail.com'];


export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Require a Firebase ID token.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Thiếu token xác thực hợp lệ.'
    });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    return res.status(401).json({
      error: 'Token xác thực không hợp lệ.'
    });
  }

  try {
    // Never trust client-supplied email headers or demo token prefixes.
    const decodedToken = await adminAuth.verifyIdToken(token);

    const email = decodedToken.email?.trim().toLowerCase();

    // Require a verified email.
    if (!email || decodedToken.email_verified !== true) {
      return res.status(403).json({
        error: 'Tài khoản phải xác minh email trước khi truy cập.'
      });
    }

    // Only server-configured administrator emails are allowed.
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({
        error: 'Bạn không có quyền quản trị.'
      });
    }

    req.user = decodedToken;
    req.customUserId = decodedToken.uid;

    return next();
  } catch (error) {
    console.error('Admin authentication failed:', error);

    return res.status(401).json({
      error: 'Token xác thực không hợp lệ hoặc đã hết hạn.'
    });
  }
};

