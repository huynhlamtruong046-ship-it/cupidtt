import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  customUserId?: string;
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập.' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.uid || decodedToken.email_verified !== true) {
      return res.status(403).json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Vui lòng xác minh email trước khi sử dụng CupidGo.',
      });
    }
    req.user = decodedToken;
    req.customUserId = decodedToken.uid;
    return next();
  } catch (error) {
    console.warn('Firebase ID token verification failed:', error);
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
};

// Use only for genuinely public endpoints that may optionally personalize responses.
// Requests with an Authorization header must contain a valid, verified Firebase token.
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) return next();
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Authorization header không hợp lệ.' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.uid || decodedToken.email_verified !== true) {
      return res.status(403).json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Vui lòng xác minh email trước khi sử dụng CupidGo.',
      });
    }
    req.user = decodedToken;
    req.customUserId = decodedToken.uid;
    return next();
  } catch (error) {
    console.warn('Optional Firebase ID token verification failed:', error);
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
};

// Configure ADMIN_EMAILS in the server environment for deployment. The default preserves
// the existing owner account; it is still accepted only with a valid Firebase token and verified email.
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'huynhlamtruong046@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập bằng tài khoản quản trị.' });
  }

  try {
    // Never trust client-supplied identity headers, user IDs, token prefixes, or frontend flags.
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email?.trim().toLowerCase();
    if (!decodedToken.uid || !email || decodedToken.email_verified !== true) {
      return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', message: 'Tài khoản phải xác minh email trước khi truy cập.' });
    }
    if (!ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Bạn không có quyền quản trị.' });
    }

    req.user = decodedToken;
    req.customUserId = decodedToken.uid;
    return next();
  } catch (error) {
    console.warn('Admin Firebase token verification failed:', error);
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token xác thực không hợp lệ hoặc đã hết hạn.' });
  }
};
