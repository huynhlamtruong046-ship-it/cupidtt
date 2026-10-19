import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import url from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import {
  seedInitialDataIfEmpty,
  getOrCreateUser,
  updateUser,
  getProfileByUserId,
  upsertProfile,
  getCandidatesForUser,
  recordSwipe,
  rewindSwipe,
  getMatchesForUser,
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
} from './src/db/dating.ts';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '10mb' }));

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

  // Auth & Sync User
  app.post('/api/auth/sync', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || req.body.uid || 'user_me_001';
      const email = req.user?.email || req.body.email || `${uid}@cupidgo.vn`;
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
      const uid = req.customUserId || (req.query.userId as string) || 'user_me_001';
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
      const uid = req.customUserId || req.body.userId || 'user_me_001';
      const profileData = req.body;
      const savedProfile = await upsertProfile(uid, profileData);
      res.json({ profile: savedProfile });
    } catch (error: any) {
      console.error('Save profile failed:', error);
      res.status(500).json({ error: error.message || 'Failed to save profile' });
    }
  });

  // Discovery candidate feed
  app.post('/api/profiles/candidates', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || req.body.userId || 'user_me_001';
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
      const uid = req.customUserId || (req.query.userId as string) || 'user_me_001';
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
      const swiperId = req.customUserId || req.body.swiperId || 'user_me_001';
      const { targetId, action } = req.body;
      if (!targetId || !action) {
        return res.status(400).json({ error: 'targetId and action are required' });
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
      const swiperId = req.customUserId || req.body.swiperId || 'user_me_001';
      const restoredProfile = await rewindSwipe(swiperId);
      res.json({ restoredProfile });
    } catch (error: any) {
      console.error('Rewind error:', error);
      res.status(500).json({ error: error.message || 'Failed to rewind swipe' });
    }
  });

  // Matches
  app.get('/api/matches', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.customUserId || (req.query.userId as string) || 'user_me_001';
      const userMatches = await getMatchesForUser(uid);
      res.json({ matches: userMatches });
    } catch (error: any) {
      console.error('Matches error:', error);
      res.status(500).json({ error: error.message || 'Failed to get matches' });
    }
  });

  // Messages for a match
  app.get('/api/matches/:matchId/messages', optionalAuth, async (req, res) => {
    try {
      const { matchId } = req.params;
      const chatMessages = await getMessagesForMatch(matchId);
      res.json({ messages: chatMessages });
    } catch (error: any) {
      console.error('Messages error:', error);
      res.status(500).json({ error: error.message || 'Failed to get messages' });
    }
  });

  // Send message
  app.post('/api/matches/:matchId/messages', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { matchId } = req.params;
      const senderId = req.customUserId || req.body.senderId || 'user_me_001';
      const { content, type, imageUrl } = req.body;

      if (!content && !imageUrl) {
        return res.status(400).json({ error: 'Content or image is required' });
      }

      const sentMsg = await createMessage(matchId, senderId, content || '', type, imageUrl);
      
      // Real-time broadcast to recipient if online
      const receiverId = req.body.receiverId;
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
      const readerId = req.customUserId || req.body.readerId || 'user_me_001';
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
      const reporterId = req.customUserId || req.body.reporterId || 'user_me_001';
      const { reportedId, type, reason } = req.body;

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
      const uid = req.customUserId || req.body.userId || 'user_me_001';
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
