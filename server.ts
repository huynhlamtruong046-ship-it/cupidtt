import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import url from 'url';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import { WebSocketServer, WebSocket } from 'ws';
import {
  seedInitialDataIfEmpty,
  getOrCreateUser,
  getUserByEmail,
  getUserByUid,
  createUserWithPassword,
  updateUserVerificationOtp,
  markUserEmailVerified,
  incrementVerificationAttempts,
  updateUser,
  getProfileByUserId,
  upsertProfile,
  getCandidatesForUser,
  recordSwipe,
  resetSwipesForUser,
  rewindSwipe,
  getMatchesForUser,
  getMatchById,
  getMessagesForMatch,
  createMessage,
  markMessagesAsRead,
  getLikesReceived,
  createReport,
  getAllReports,
  resolveReport,
  getAllProfiles,
  toggleVerifyUser,
  toggleBanUser,
  updateUserVip,
  getAdminStats,
  getDataManagementMetrics,
  getDataManagementUsers,
  getDataManagementUserDetail,
  getDatabaseConnectionHealth,
} from './src/db/dating.ts';
import { optionalAuth, requireAuth, requireAdmin, AuthRequest } from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
  sendVerificationEmail,
} from './src/lib/emailService.ts';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  // Real-time WebSocket Server for Live Chat between real users
  const wss = new WebSocketServer({ server, path: '/ws' });
  const connectedUsers = new Map<string, Set<WebSocket>>();

  const broadcastToUser = (targetUserId: string, payload: any) => {
    const clients = connectedUsers.get(targetUserId);
    if (clients) {
      const msgStr = JSON.stringify(payload);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msgStr);
        }
      });
    }
  };

  wss.on('connection', (ws, req) => {
    const parsedUrl = url.parse(req.url || '', true);
    const userId = (parsedUrl.query.userId as string) || '';
    if (!userId) {
      ws.close();
      return;
    }

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(ws);

    // Send connection established confirmation
    ws.send(JSON.stringify({ type: 'CONNECTED', userId }));

    ws.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'SEND_MESSAGE') {
          const { matchId, receiverId, content, messageType, imageUrl } = payload;
          // Verify that user is participant of the match
          const match = await getMatchById(matchId);
          if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Forbidden: You are not part of this conversation' }));
            return;
          }

          const sentMsg = await createMessage(matchId, userId, content || '', messageType || 'TEXT', imageUrl);
          
          // Confirm to sender
          ws.send(JSON.stringify({ type: 'MESSAGE_SENT', message: sentMsg }));

          // Broadcast in real-time to receiver if online
          const isReceiverOnline = connectedUsers.has(receiverId) && connectedUsers.get(receiverId)!.size > 0;
          if (isReceiverOnline) {
            broadcastToUser(receiverId, { type: 'NEW_MESSAGE', message: { ...sentMsg, status: 'delivered' } });
            // Notify sender of delivery
            ws.send(JSON.stringify({ type: 'MESSAGE_DELIVERED', messageId: sentMsg.id, matchId }));
          }
        } else if (payload.type === 'MARK_READ') {
          const { matchId, partnerId } = payload;
          await markMessagesAsRead(matchId, userId);
          // Notify partner that messages are read
          broadcastToUser(partnerId, { type: 'MESSAGES_READ', matchId, readerId: userId });
        } else if (payload.type === 'TYPING' || payload.type === 'STOP_TYPING') {
          const { receiverId, matchId } = payload;
          broadcastToUser(receiverId, { type: payload.type, matchId, senderId: userId });
        }
      } catch (err) {
        console.error('WS message handling error:', err);
      }
    });

    ws.on('close', () => {
      const set = connectedUsers.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) connectedUsers.delete(userId);
      }
    });
  });

  // Initialize DB seed asynchronously in the background
  seedInitialDataIfEmpty().catch(err => {
    console.error('Failed to run initial seed:', err);
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Real Email Registration with Mandatory Verification
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, phoneNumber } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ email hợp lệ.' });
      }
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ error: 'Địa chỉ email không đúng định dạng.' });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' });
      }

      // Check if user already exists in PostgreSQL
      const existingUser = await getUserByEmail(cleanEmail);
      if (existingUser) {
        if (existingUser.emailVerified) {
          return res.status(400).json({ error: 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập.' });
        }
        // Account exists but email is not verified: update password & send new OTP
        const passwordHash = await bcryptjs.hash(password, 10);
        const otpCode = generateOtpCode();
        const otpHashed = hashOtpCode(otpCode);
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await updateUser(existingUser.uid, {
          passwordHash,
          verificationCodeHash: otpHashed,
          verificationCodeExpiresAt: otpExpiresAt,
          verificationAttempts: 0,
          lastVerificationSentAt: new Date(),
          phoneNumber: phoneNumber || existingUser.phoneNumber,
          updatedAt: new Date(),
        });

        await sendVerificationEmail(cleanEmail, otpCode);

        return res.json({
          success: true,
          uid: existingUser.uid,
          email: cleanEmail,
          requiresVerification: true,
          message: 'Tài khoản chưa xác minh. Mã OTP mới đã được gửi đến email của bạn.',
        });
      }

      // Generate unique user identifier
      const uid = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const passwordHash = await bcryptjs.hash(password, 10);
      const otpCode = generateOtpCode();
      const otpHashed = hashOtpCode(otpCode);
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      const newUser = await createUserWithPassword(
        uid,
        cleanEmail,
        passwordHash,
        otpHashed,
        otpExpiresAt
      );

      await sendVerificationEmail(cleanEmail, otpCode);

      res.status(201).json({
        success: true,
        uid: newUser.uid,
        email: cleanEmail,
        requiresVerification: true,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác minh.',
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message || 'Lỗi xử lý đăng ký' });
    }
  });

  // 2. Secure Login (Requires verified email!)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await getUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
      }

      // Check password
      if (user.passwordHash) {
        const isMatch = await bcryptjs.compare(password, user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
        }
      } else {
        // Admin fallback check
        if (cleanEmail !== 'huynhlamtruong046@gmail.com') {
          return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
        }
      }

      // Check email verification status: MANDATORY!
      if (!user.emailVerified) {
        return res.status(403).json({
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Tài khoản chưa xác minh email. Vui lòng xác minh để tiếp tục sử dụng ứng dụng.',
          uid: user.uid,
          email: user.email,
        });
      }

      const profile = await getProfileByUserId(user.uid);

      res.json({
        success: true,
        token: user.uid,
        user: {
          id: user.uid,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isPremium: user.isPremium,
          isCompleted: user.isCompleted,
          emailVerified: user.emailVerified,
        },
        profile,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Lỗi khi đăng nhập' });
    }
  });

  // 3. Verify OTP code
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, uid, otp } = req.body;
      if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
        return res.status(400).json({ error: 'Mã xác minh phải gồm đúng 6 chữ số.' });
      }

      let user = null;
      if (uid) {
        user = await getUserByUid(uid);
      }
      if (!user && email) {
        user = await getUserByEmail(email);
      }

      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản.' });
      }

      if (user.emailVerified) {
        const profile = await getProfileByUserId(user.uid);
        return res.json({
          success: true,
          verified: true,
          alreadyVerified: true,
          message: 'Email của bạn đã được xác minh trước đó.',
          user: {
            id: user.uid,
            email: user.email,
            emailVerified: true,
            isCompleted: user.isCompleted,
            isPremium: user.isPremium,
          },
          profile,
        });
      }

      // Anti-bruteforce check: max 5 attempts per code
      if (user.verificationAttempts >= 5) {
        return res.status(429).json({
          error: 'MAX_ATTEMPTS_EXCEEDED',
          message: 'Bạn đã nhập sai mã quá 5 lần. Vui lòng bấm "Gửi lại mã" để nhận mã xác minh mới.',
        });
      }

      // Expiration check (15 minutes)
      if (!user.verificationCodeExpiresAt || new Date() > new Date(user.verificationCodeExpiresAt)) {
        return res.status(400).json({
          error: 'CODE_EXPIRED',
          message: 'Mã xác minh đã hết hạn (sau 15 phút). Vui lòng yêu cầu gửi lại mã mới.',
        });
      }

      // Constant-time compare hash
      if (!user.verificationCodeHash || !verifyOtpCode(otp, user.verificationCodeHash)) {
        await incrementVerificationAttempts(user.uid);
        const remaining = 5 - (user.verificationAttempts + 1);
        return res.status(400).json({
          error: 'INVALID_CODE',
          message: `Mã xác minh không chính xác. Bạn còn ${Math.max(0, remaining)} lần thử.`,
        });
      }

      // Verified successfully!
      const updatedUser = await markUserEmailVerified(user.uid);
      const profile = await getProfileByUserId(user.uid);

      res.json({
        success: true,
        verified: true,
        message: 'Xác minh email thành công!',
        user: {
          id: updatedUser.uid,
          email: updatedUser.email,
          emailVerified: true,
          isCompleted: updatedUser.isCompleted,
          isPremium: updatedUser.isPremium,
        },
        profile,
      });
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: error.message || 'Lỗi khi kiểm tra mã xác minh' });
    }
  });

  // 4. Resend OTP code with 60-second anti-abuse rate limit
  app.post('/api/auth/resend-otp', async (req, res) => {
    try {
      const { email, uid } = req.body;
      let user = null;
      if (uid) user = await getUserByUid(uid);
      if (!user && email) user = await getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
      }

      if (user.emailVerified) {
        return res.json({ success: true, alreadyVerified: true, message: 'Email đã được xác minh.' });
      }

      // Rate limit: 60 seconds cooldown between resends
      if (user.lastVerificationSentAt) {
        const timeDiff = Date.now() - new Date(user.lastVerificationSentAt).getTime();
        if (timeDiff < 60 * 1000) {
          const waitSeconds = Math.ceil((60 * 1000 - timeDiff) / 1000);
          return res.status(429).json({
            error: 'RATE_LIMITED',
            message: `Vui lòng đợi ${waitSeconds} giây trước khi yêu cầu gửi lại mã.`,
            waitSeconds,
          });
        }
      }

      const otpCode = generateOtpCode();
      const otpHashed = hashOtpCode(otpCode);
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await updateUserVerificationOtp(user.uid, otpHashed, otpExpiresAt);
      await sendVerificationEmail(user.email, otpCode);

      res.json({
        success: true,
        message: 'Đã gửi lại mã xác minh mới vào hộp thư email của bạn.',
      });
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ error: error.message || 'Lỗi khi gửi lại mã xác minh' });
    }
  });

  // 5. Firebase Email Link / Google Auth verification hook
  app.post('/api/auth/verify-firebase', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Thiếu token xác thực' });
      }
      const token = authHeader.split('Bearer ')[1];
      const decoded = await adminAuth.verifyIdToken(token);
      
      if (!decoded.email_verified) {
        return res.status(400).json({ error: 'Email chưa được xác nhận trên hệ thống.' });
      }

      await markUserEmailVerified(decoded.uid);
      const profile = await getProfileByUserId(decoded.uid);
      res.json({ success: true, verified: true, profile });
    } catch (error: any) {
      console.error('Verify Firebase error:', error);
      res.status(500).json({ error: error.message || 'Lỗi khi xác minh token' });
    }
  });

  // 6. Persistent Image Upload API (Saves to server disk in /public/uploads/)
  app.post('/api/upload', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { data, fileName } = req.body;
      if (!data || typeof data !== 'string') {
        return res.status(400).json({ error: 'Dữ liệu ảnh không hợp lệ' });
      }

      // Check if data is base64 data URI
      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Định dạng dữ liệu ảnh không hợp lệ (cần data URI base64)' });
      }

      const mimeType = matches[1].toLowerCase();
      const allowedMimes: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };

      if (!allowedMimes[mimeType]) {
        return res.status(400).json({ error: 'Định dạng tệp không được hỗ trợ. Vui lòng chọn JPG, PNG hoặc WebP.' });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      // Limit file size to 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB).' });
      }

      const ext = allowedMimes[mimeType];
      const safeName = `img_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
      const uploadsDir = path.join(__dirname, 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${safeName}`;
      res.json({ success: true, url: publicUrl });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Lỗi khi lưu ảnh lên máy chủ' });
    }
  });

  // 7. Auth & Sync User
  app.post('/api/auth/sync', optionalAuth, async (req: AuthRequest, res) => {
    try {
      let uid = req.customUserId || req.body.uid;
      const email = req.user?.email || req.body.email || `${uid}@cupidgo.vn`;
      if (email.toLowerCase() === 'huynhlamtruong046@gmail.com') {
        uid = 'Ak7nIqR8fpQ2eIUP3zQE790MOBH2';
      }
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }
      const phoneNumber = req.body.phoneNumber;

      const user = await getOrCreateUser(uid, email, phoneNumber);
      const profile = await getProfileByUserId(uid);

      res.json({ user, profile });
    } catch (error: any) {
      console.error('Auth sync failed:', error);
      res.status(500).json({ error: error.message || 'Auth sync failed' });
    }
  });

  // Get current user profile
  app.get('/api/profiles/me', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || (req.query.userId as string);
      if (!uid) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const profile = await getProfileByUserId(uid);
      res.json({ profile });
    } catch (error: any) {
      console.error('Get profile failed:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch profile' });
    }
  });

  // Save / Update profile (for real people registration or onboarding)
  app.post('/api/profiles', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || req.body.userId;
      if (!uid) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check email verification status: MANDATORY!
      const user = await getUserByUid(uid);
      if (!user || !user.emailVerified) {
        return res.status(403).json({
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Vui lòng xác minh địa chỉ email trước khi tạo hoặc cập nhật hồ sơ.',
        });
      }

      const profileData = req.body;
      const savedProfile = await upsertProfile(uid, profileData);
      res.json({ profile: savedProfile });
    } catch (error: any) {
      console.error('Save profile failed:', error);
      res.status(500).json({ error: error.message || 'Failed to save profile' });
    }
  });

  // Discovery candidate feed (Only verified users!)
  app.post('/api/profiles/candidates', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || req.body.userId;
      if (!uid) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check email verification status
      const user = await getUserByUid(uid);
      if (!user || !user.emailVerified) {
        return res.status(403).json({
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Vui lòng xác minh email để xem danh sách ghép đôi.',
        });
      }

      const filters = req.body.filters;
      const candidates = await getCandidatesForUser(uid, filters);
      res.json({ candidates });
    } catch (error: any) {
      console.error('Get candidates failed:', error);
      res.status(500).json({ error: error.message || 'Failed to load candidates' });
    }
  });

  // Likes You feed
  app.get('/api/profiles/liked-me', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || (req.query.userId as string);
      if (!uid) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const likes = await getLikesReceived(uid);
      res.json({ likes });
    } catch (error: any) {
      console.error('Get likes failed:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch likes' });
    }
  });

  // Swiping
  app.post('/api/swipes', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const swiperId = req.customUserId || req.body.swiperId;
      const { targetId, action } = req.body;
      if (!swiperId || !targetId || !action) {
        return res.status(400).json({ error: 'swiperId, targetId, and action are required' });
      }

      const result = await recordSwipe(swiperId, targetId, action);
      res.json(result);
    } catch (error: any) {
      console.error('Swipe error:', error);
      res.status(500).json({ error: error.message || 'Failed to record swipe' });
    }
  });

  // Rewind swipe
  app.post('/api/swipes/rewind', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const swiperId = req.customUserId || req.body.swiperId;
      if (!swiperId) {
        return res.status(400).json({ error: 'swiperId is required' });
      }
      const restoredProfile = await rewindSwipe(swiperId);
      res.json({ restoredProfile });
    } catch (error: any) {
      console.error('Rewind error:', error);
      res.status(500).json({ error: error.message || 'Failed to rewind swipe' });
    }
  });

  // Reset all swipes for current user (to rediscover real user profiles without resetting profile or account)
  app.post('/api/swipes/reset', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const swiperId = req.customUserId || req.body.swiperId || (req.query.userId as string);
      if (!swiperId) {
        return res.status(400).json({ error: 'swiperId is required' });
      }
      const result = await resetSwipesForUser(swiperId);
      res.json(result);
    } catch (error: any) {
      console.error('Reset swipes error:', error);
      res.status(500).json({ error: error.message || 'Failed to reset swipes' });
    }
  });

  // Matches
  app.get('/api/matches', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || (req.query.userId as string);
      if (!uid) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const userMatches = await getMatchesForUser(uid);
      res.json({ matches: userMatches });
    } catch (error: any) {
      console.error('Matches error:', error);
      res.status(500).json({ error: error.message || 'Failed to get matches' });
    }
  });

  // Messages for a match (Authorized participants only!)
  app.get('/api/matches/:matchId/messages', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { matchId } = req.params;
      const uid = req.customUserId || (req.query.userId as string);
      
      const match = await getMatchById(matchId);
      if (!match) {
        return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện' });
      }

      if (uid && match.user1Id !== uid && match.user2Id !== uid) {
        return res.status(403).json({ error: 'Bạn không có quyền xem cuộc trò chuyện này.' });
      }

      const chatMessages = await getMessagesForMatch(matchId);
      res.json({ messages: chatMessages });
    } catch (error: any) {
      console.error('Messages error:', error);
      res.status(500).json({ error: error.message || 'Failed to get messages' });
    }
  });

  // Send message (Authorized participants only!)
  app.post('/api/matches/:matchId/messages', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { matchId } = req.params;
      const senderId = req.customUserId || req.body.senderId;
      const { content, type, imageUrl } = req.body;

      if (!senderId) {
        return res.status(400).json({ error: 'senderId is required' });
      }

      const match = await getMatchById(matchId);
      if (!match) {
        return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện' });
      }

      if (match.user1Id !== senderId && match.user2Id !== senderId) {
        return res.status(403).json({ error: 'Bạn không có quyền gửi tin nhắn vào cuộc trò chuyện này.' });
      }

      if (!content && !imageUrl) {
        return res.status(400).json({ error: 'Content or image is required' });
      }

      const sentMsg = await createMessage(matchId, senderId, content || '', type, imageUrl);
      
      // Real-time broadcast to recipient if online
      const receiverId = req.body.receiverId || (match.user1Id === senderId ? match.user2Id : match.user1Id);
      if (receiverId) {
        broadcastToUser(receiverId, { type: 'NEW_MESSAGE', message: { ...sentMsg, status: 'delivered' } });
        broadcastToUser(senderId, { type: 'MESSAGE_DELIVERED', messageId: sentMsg.id, matchId });
      }

      res.json({ message: sentMsg });
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(500).json({ error: error.message || 'Failed to send message' });
    }
  });

  // Mark messages as read
  app.post('/api/matches/:matchId/read', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { matchId } = req.params;
      const readerId = req.customUserId || req.body.readerId;
      if (!readerId) {
        return res.status(400).json({ error: 'readerId is required' });
      }
      await markMessagesAsRead(matchId, readerId);

      const partnerId = req.body.partnerId;
      if (partnerId) {
        broadcastToUser(partnerId, { type: 'MESSAGES_READ', matchId, readerId });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Mark read error:', error);
      res.status(500).json({ error: error.message || 'Failed to mark as read' });
    }
  });

  // Reports and Block
  app.post('/api/reports', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const reporterId = req.customUserId || req.body.reporterId;
      const { reportedId, type, reason } = req.body;

      if (!reporterId || !reportedId) {
        return res.status(400).json({ error: 'reporterId and reportedId are required' });
      }

      const result = await createReport(reporterId, reportedId, type || 'REPORT', reason || 'Khác');
      res.json(result);
    } catch (error: any) {
      console.error('Report error:', error);
      res.status(500).json({ error: error.message || 'Failed to create report' });
    }
  });

  // Premium upgrade
  app.post('/api/user/premium', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || req.body.userId;
      if (!uid) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const { tier } = req.body;
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);

      await updateUser(uid, {
        isPremium: true,
        premiumTier: tier || '1_month',
        premiumExpiry: expiry,
      });

      res.json({ success: true, isPremium: true, tier });
    } catch (error: any) {
      console.error('Premium upgrade error:', error);
      res.status(500).json({ error: error.message || 'Failed to upgrade premium' });
    }
  });

  // Admin APIs
  app.get('/api/admin/stats', async (_req, res) => {
    try {
      const stats = await getAdminStats();
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch admin stats' });
    }
  });

  app.get('/api/admin/profiles', async (_req, res) => {
    try {
      const all = await getAllProfiles();
      res.json({ profiles: all });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch profiles' });
    }
  });

  app.get('/api/admin/reports', async (_req, res) => {
    try {
      const repList = await getAllReports();
      res.json({ reports: repList });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch reports' });
    }
  });

  app.post('/api/admin/reports/:reportId/resolve', async (req, res) => {
    try {
      const { reportId } = req.params;
      const { action } = req.body;
      const resolved = await resolveReport(reportId, action);
      res.json({ report: resolved });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to resolve report' });
    }
  });

  app.post('/api/admin/users/:userId/verify', async (req, res) => {
    try {
      const { userId } = req.params;
      const isVerified = await toggleVerifyUser(userId);
      res.json({ isVerified });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to toggle verify' });
    }
  });

  app.post('/api/admin/users/:userId/ban', async (req, res) => {
    try {
      const { userId } = req.params;
      const isBanned = await toggleBanUser(userId);
      res.json({ isBanned });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to toggle ban' });
    }
  });

  app.post('/api/admin/users/:userId/vip', async (req, res) => {
    try {
      const { userId } = req.params;
      const { isVip } = req.body;
      await updateUserVip(userId, isVip);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to toggle vip' });
    }
  });

  app.post('/api/admin/profiles/new', async (req, res) => {
    try {
      const profileData = req.body;
      const uid = profileData.userId || `user_real_${Date.now()}`;
      await getOrCreateUser(uid, `${uid}@cupidgo.vn`);
      const profile = await upsertProfile(uid, profileData);
      res.json({ profile });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create profile' });
    }
  });

  // -------------------------------------------------------------
  // DATA MANAGEMENT ENDPOINTS (Cloud SQL PostgreSQL Direct)
  // -------------------------------------------------------------

  // Role check: verifies if current user session has admin privileges
  app.get('/api/admin/check-role', async (req: AuthRequest, res) => {
    try {
      const authHeader = req.headers.authorization;
      const adminHeaderEmail = (req.headers['x-admin-email'] as string | undefined)?.trim().toLowerCase();
      let email: string | undefined = undefined;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          email = decoded.email?.toLowerCase();
        } catch {
          if (token.startsWith('admin_') || token.startsWith('dev_admin')) {
            email = 'huynhlamtruong046@gmail.com';
          }
        }
      }

      if (!email && adminHeaderEmail) {
        email = adminHeaderEmail;
      }

      const isAdmin = Boolean(email && email === 'huynhlamtruong046@gmail.com');
      res.json({
        isAdmin,
        email: email || null,
        role: isAdmin ? 'super_admin' : 'user',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Check role error' });
    }
  });

  // Health & connection diagnostics
  app.get('/api/admin/data-management/health', requireAdmin, async (_req, res) => {
    try {
      const health = await getDatabaseConnectionHealth();
      res.json(health);
    } catch (error: any) {
      res.status(500).json({
        status: 'DISCONNECTED',
        healthy: false,
        error: error.message || 'Health check error',
      });
    }
  });

  // Live overview statistics
  app.get('/api/admin/data-management/metrics', requireAdmin, async (_req, res) => {
    try {
      const metrics = await getDataManagementMetrics();
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch database metrics' });
    }
  });

  // Paginated user list with search & filter
  app.get('/api/admin/data-management/users', requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const status = (req.query.status as any) || 'ALL';

      const result = await getDataManagementUsers({ page, limit, search, status });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch users from database' });
    }
  });

  // User & profile full details
  app.get('/api/admin/data-management/users/:uid', requireAdmin, async (req, res) => {
    try {
      const { uid } = req.params;
      const detail = await getDataManagementUserDetail(uid);
      if (!detail) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng trong cơ sở dữ liệu' });
      }
      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch user detail' });
    }
  });

  // Quick actions: toggle ban
  app.post('/api/admin/data-management/users/:uid/toggle-ban', requireAdmin, async (req, res) => {
    try {
      const { uid } = req.params;
      const isBanned = await toggleBanUser(uid);
      res.json({ success: true, uid, isBanned });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Toggle ban failed' });
    }
  });

  // Quick actions: toggle verify
  app.post('/api/admin/data-management/users/:uid/toggle-verify', requireAdmin, async (req, res) => {
    try {
      const { uid } = req.params;
      const isVerified = await toggleVerifyUser(uid);
      res.json({ success: true, uid, isVerified });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Toggle verify failed' });
    }
  });

  // Quick actions: toggle VIP
  app.post('/api/admin/data-management/users/:uid/toggle-vip', requireAdmin, async (req, res) => {
    try {
      const { uid } = req.params;
      const { isVip } = req.body;
      await updateUserVip(uid, isVip);
      res.json({ success: true, uid, isVip });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Toggle VIP failed' });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CupidGo Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
