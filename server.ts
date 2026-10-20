import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import url from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import {
  seedInitialDataIfEmpty,
  getOrCreateUser,
  getUserByUid,
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
import { requireAuth, requireAdmin, AuthRequest, ADMIN_EMAILS } from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';

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

  // Authenticated real-time chat. The browser offers a normal subprotocol plus
  // a Firebase ID token subprotocol; only the normal subprotocol is echoed back.
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    handleProtocols: (protocols) => protocols.has('cupidgo-v1') ? 'cupidgo-v1' : false,
  });
  const connectedUsers = new Map<string, Set<WebSocket>>();

  const broadcastToUser = (targetUserId: string, payload: unknown) => {
    const clients = connectedUsers.get(targetUserId);
    if (!clients) return;
    const msgStr = JSON.stringify(payload);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(msgStr);
    });
  };

  wss.on('connection', (ws, req) => {
    const rawProtocols = req.headers['sec-websocket-protocol'];
    const offeredProtocols = (typeof rawProtocols === 'string' ? rawProtocols : '')
      .split(',').map((value) => value.trim()).filter(Boolean);
    const tokenProtocol = offeredProtocols.find((value) => value.startsWith('firebase.'));
    const token = tokenProtocol?.slice('firebase.'.length);
    let userId: string | null = null;

    const authentication = (async (): Promise<boolean> => {
      if (!token) {
        ws.close(1008, 'Firebase authentication required');
        return false;
      }
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded.email_verified !== true || !decoded.uid) {
          ws.close(1008, 'Verified email required');
          return false;
        }
        if (ws.readyState !== WebSocket.OPEN) return false;
        userId = decoded.uid;
        if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
        connectedUsers.get(userId)!.add(ws);
        ws.send(JSON.stringify({ type: 'CONNECTED', userId }));
        return true;
      } catch (error) {
        console.warn('WebSocket Firebase token verification failed:', error);
        if (ws.readyState === WebSocket.OPEN) ws.close(1008, 'Invalid authentication');
        return false;
      }
    })();

    ws.on('message', async (data) => {
      try {
        if (!(await authentication) || !userId) return;
        const payload = JSON.parse(data.toString());
        const matchId = typeof payload.matchId === 'string' ? payload.matchId : '';
        if (!matchId) return;

        const match = await getMatchById(matchId);
        if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Bạn không có quyền truy cập cuộc trò chuyện này.' }));
          return;
        }
        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id;

        if (payload.type === 'SEND_MESSAGE') {
          const content = typeof payload.content === 'string' ? payload.content : '';
          const imageUrl = typeof payload.imageUrl === 'string' ? payload.imageUrl : undefined;
          const messageType = payload.messageType === 'IMAGE' ? 'IMAGE' : 'TEXT';
          if ((!content.trim() && !imageUrl) || content.length > 5000) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Nội dung tin nhắn không hợp lệ.' }));
            return;
          }
          const sentMsg = await createMessage(matchId, userId, content, messageType, imageUrl);
          ws.send(JSON.stringify({ type: 'MESSAGE_SENT', message: sentMsg }));
          if (connectedUsers.has(partnerId)) {
            broadcastToUser(partnerId, { type: 'NEW_MESSAGE', message: sentMsg });
            broadcastToUser(userId, { type: 'MESSAGE_DELIVERED', messageId: sentMsg.id, matchId });
          }
        } else if (payload.type === 'MARK_READ') {
          await markMessagesAsRead(matchId, userId);
          broadcastToUser(partnerId, { type: 'MESSAGES_READ', matchId, readerId: userId });
        } else if (payload.type === 'TYPING' || payload.type === 'STOP_TYPING') {
          broadcastToUser(partnerId, { type: payload.type, matchId, senderId: userId });
        }
      } catch (error) {
        console.error('WebSocket message handling failed:', error);
      }
    });

    ws.on('close', () => {
      if (!userId) return;
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) connectedUsers.delete(userId);
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

  // Email/password account creation and verification are handled by Firebase Authentication.
  // The old PostgreSQL-only OTP routes returned non-Firebase UIDs and could not create secure sessions.
  const legacyAuthEndpoint = (_req: express.Request, res: express.Response) => res.status(410).json({
    error: 'AUTH_PROVIDER_CHANGED',
    message: 'Hãy đăng ký/đăng nhập bằng Firebase Authentication trong giao diện CupidGo.',
  });
  app.post('/api/auth/register', legacyAuthEndpoint);
  app.post('/api/auth/login', legacyAuthEndpoint);
  app.post('/api/auth/verify-otp', legacyAuthEndpoint);
  app.post('/api/auth/resend-otp', legacyAuthEndpoint);

  // 5. Firebase Email Link / Google Auth verification hook
  app.post('/api/auth/verify-firebase', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId;
      const email = req.user?.email?.trim().toLowerCase();
      if (!uid || !email || req.user?.email_verified !== true) {
        return res.status(403).json({ error: 'Email chưa được xác minh.' });
      }
      await getOrCreateUser(uid, email, req.user?.phone_number);
      await updateUser(uid, { email, emailVerified: true, phoneNumber: req.user?.phone_number || null });
      const profile = await getProfileByUserId(uid);
      return res.json({ success: true, verified: true, profile });
    } catch (error: any) {
      console.error('Verify Firebase error:', error);
      return res.status(500).json({ error: 'Không thể đồng bộ trạng thái xác minh.' });
    }
  });

  // 6. Persistent Image Upload API (Saves to server disk in /public/uploads/)
  app.post('/api/upload', requireAuth, async (req: AuthRequest, res) => {
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
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId;
      const email = req.user?.email?.trim().toLowerCase();
      if (!uid || !email || req.user?.email_verified !== true) {
        return res.status(403).json({ error: 'Tài khoản phải xác minh email trước khi sử dụng CupidGo.' });
      }

      const phoneNumber = req.user?.phone_number || undefined;
      await getOrCreateUser(uid, email, phoneNumber);
      const user = await updateUser(uid, {
        email,
        emailVerified: true,
        phoneNumber: phoneNumber || null,
      });
      const profile = await getProfileByUserId(uid);
      return res.json({ user, profile });
    } catch (error: any) {
      console.error('Auth sync failed:', error);
      return res.status(500).json({ error: 'Không thể đồng bộ tài khoản với cơ sở dữ liệu.' });
    }
  });

  // Get current user profile
  app.get('/api/profiles/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId;
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
  app.post('/api/profiles', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId;
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
      if (profileData.photos !== undefined) {
        if (!Array.isArray(profileData.photos) || profileData.photos.length > 6) {
          return res.status(400).json({ error: 'Hồ sơ chỉ được có tối đa 6 ảnh.' });
        }
        for (const photo of profileData.photos) {
          if (typeof photo !== 'string' || photo.length > 1_500_000) {
            return res.status(400).json({ error: 'Ảnh không hợp lệ hoặc quá lớn; mỗi ảnh tối đa 1 MB.' });
          }
        }
      }
      const existingProfile = await getProfileByUserId(uid);
      const safeProfileData = {
        ...profileData,
        userId: uid,
        isVerified: existingProfile?.isVerified ?? false,
        isBanned: existingProfile?.isBanned ?? false,
      };
      const savedProfile = await upsertProfile(uid, safeProfileData);
      res.json({ profile: savedProfile });
    } catch (error: any) {
      console.error('Save profile failed:', error);
      res.status(500).json({ error: error.message || 'Failed to save profile' });
    }
  });

  // Discovery candidate feed (Only verified users!)
  app.post('/api/profiles/candidates', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId;
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
  app.get('/api/profiles/liked-me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId;
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
  app.post('/api/swipes', requireAuth, async (req: AuthRequest, res) => {
    try {
      const swiperId = req.customUserId;
      const { targetId, action } = req.body || {};
      if (!swiperId || typeof targetId !== 'string' || !targetId || !['LIKE', 'PASS', 'SUPER_LIKE'].includes(action)) {
        return res.status(400).json({ error: 'targetId or swipe action is invalid.' });
      }
      if (targetId === swiperId) {
        return res.status(400).json({ error: 'Không thể vuốt hồ sơ của chính mình.' });
      }
      const targetUser = await getUserByUid(targetId);
      const targetProfile = await getProfileByUserId(targetId);
      if (!targetUser || targetUser.emailVerified !== true || !targetUser.isCompleted || !targetProfile || targetProfile.isBanned) {
        return res.status(404).json({ error: 'Hồ sơ không tồn tại hoặc không đủ điều kiện ghép đôi.' });
      }

      const result = await recordSwipe(swiperId, targetId, action);
      res.json(result);
    } catch (error: any) {
      console.error('Swipe error:', error);
      res.status(500).json({ error: error.message || 'Failed to record swipe' });
    }
  });

  // Rewind swipe
  app.post('/api/swipes/rewind', requireAuth, async (req: AuthRequest, res) => {
    try {
      const swiperId = req.customUserId;
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
  app.post('/api/swipes/reset', requireAuth, async (req: AuthRequest, res) => {
    try {
      const swiperId = req.customUserId;
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
  app.get('/api/matches', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId;
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
  app.get('/api/matches/:matchId/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { matchId } = req.params;
      const uid = req.customUserId;
      
      const match = await getMatchById(matchId);
      if (!match) {
        return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện' });
      }

      if (!uid || (match.user1Id !== uid && match.user2Id !== uid)) {
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
  app.post('/api/matches/:matchId/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { matchId } = req.params;
      const senderId = req.customUserId;
      const { content, type, imageUrl } = req.body;
      const safeContent = typeof content === 'string' ? content : '';
      const safeImageUrl = typeof imageUrl === 'string' ? imageUrl : undefined;
      const safeType = type === 'IMAGE' ? 'IMAGE' : 'TEXT';

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

      if ((!safeContent.trim() && !safeImageUrl) || safeContent.length > 5000) {
        return res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ.' });
      }
      if (safeImageUrl && safeImageUrl.length > 1_500_000) {
        return res.status(400).json({ error: 'Ảnh gửi trong chat vượt giới hạn 1 MB.' });
      }

      const sentMsg = await createMessage(matchId, senderId, safeContent, safeType, safeImageUrl);
      
      // Real-time broadcast to recipient if online
      const receiverId = match.user1Id === senderId ? match.user2Id : match.user1Id;
      broadcastToUser(receiverId, { type: 'NEW_MESSAGE', message: sentMsg });
      broadcastToUser(senderId, { type: 'MESSAGE_DELIVERED', messageId: sentMsg.id, matchId });

      res.json({ message: sentMsg });
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(500).json({ error: error.message || 'Failed to send message' });
    }
  });

  // Mark messages as read
  app.post('/api/matches/:matchId/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { matchId } = req.params;
      const readerId = req.customUserId;
      if (!readerId) {
        return res.status(400).json({ error: 'readerId is required' });
      }
      const match = await getMatchById(matchId);
      if (!match) return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện.' });
      if (match.user1Id !== readerId && match.user2Id !== readerId) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập cuộc trò chuyện này.' });
      }
      await markMessagesAsRead(matchId, readerId);
      const partnerId = match.user1Id === readerId ? match.user2Id : match.user1Id;
      broadcastToUser(partnerId, { type: 'MESSAGES_READ', matchId, readerId });
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Mark read error:', error);
      res.status(500).json({ error: error.message || 'Failed to mark as read' });
    }
  });

  // Reports and Block
  app.post('/api/reports', requireAuth, async (req: AuthRequest, res) => {
    try {
      const reporterId = req.customUserId;
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

  // Premium must not be granted by a client request without verified payment-provider evidence.
  // Connect a payment provider and verify its signed webhook before enabling this endpoint.
  app.post('/api/user/premium', requireAuth, (_req: AuthRequest, res) => {
    return res.status(501).json({
      error: 'PAYMENTS_NOT_CONFIGURED',
      message: 'Thanh toán VIP chưa được tích hợp. Tài khoản chưa được nâng cấp.',
    });
  });

  // Admin APIs
  app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
    try {
      const stats = await getAdminStats();
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch admin stats' });
    }
  });

  app.get('/api/admin/profiles', requireAdmin, async (_req, res) => {
    try {
      const all = await getAllProfiles();
      res.json({ profiles: all });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch profiles' });
    }
  });

  app.get('/api/admin/reports', requireAdmin, async (_req, res) => {
    try {
      const repList = await getAllReports();
      res.json({ reports: repList });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch reports' });
    }
  });

  app.post('/api/admin/reports/:reportId/resolve', requireAdmin, async (req, res) => {
    try {
      const { reportId } = req.params;
      const { action } = req.body;
      const resolved = await resolveReport(reportId, action);
      res.json({ report: resolved });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to resolve report' });
    }
  });

  app.post('/api/admin/users/:userId/verify', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const isVerified = await toggleVerifyUser(userId);
      res.json({ isVerified });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to toggle verify' });
    }
  });

  app.post('/api/admin/users/:userId/ban', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const isBanned = await toggleBanUser(userId);
      res.json({ isBanned });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to toggle ban' });
    }
  });

  app.post('/api/admin/users/:userId/vip', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isVip } = req.body;
      await updateUserVip(userId, isVip);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to toggle vip' });
    }
  });

  app.post('/api/admin/profiles/new', requireAdmin, async (req, res) => {
    try {
      const profileData = req.body || {};
      const uid = typeof profileData.userId === 'string' ? profileData.userId.trim() : '';
      if (!uid) {
        return res.status(400).json({ error: 'Chỉ có thể quản lý hồ sơ của tài khoản đã đăng ký; không tạo hồ sơ giả.' });
      }
      const targetUser = await getUserByUid(uid);
      if (!targetUser || targetUser.emailVerified !== true) {
        return res.status(400).json({ error: 'Tài khoản không tồn tại hoặc chưa xác minh email.' });
      }
      const existingProfile = await getProfileByUserId(uid);
      const profile = await upsertProfile(uid, {
        ...profileData,
        userId: uid,
        isVerified: existingProfile?.isVerified ?? false,
        isBanned: existingProfile?.isBanned ?? false,
      });
      return res.json({ profile });
    } catch (error: any) {
      console.error('Admin profile update failed:', error);
      return res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  // -------------------------------------------------------------
  // DATA MANAGEMENT ENDPOINTS (Cloud SQL PostgreSQL Direct)
  // -------------------------------------------------------------

  // Role check is informational; all actual admin endpoints still use requireAdmin.
  app.get('/api/admin/check-role', requireAuth, (req: AuthRequest, res) => {
    const email = req.user?.email?.trim().toLowerCase() || null;
    const isAdmin = Boolean(email && req.user?.email_verified === true && ADMIN_EMAILS.includes(email));
    return res.json({
      isAdmin,
      email,
      role: isAdmin ? 'super_admin' : 'user',
      timestamp: new Date().toISOString(),
    });
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
