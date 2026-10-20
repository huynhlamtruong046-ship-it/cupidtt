import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import {
  User,
  Profile,
  SwipeAction,
  SwipeRecord,
  Match,
  Message,
  FilterState,
  ReportItem,
  AdminStats,
} from '../types/index.ts';


async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    const token = await firebaseUser.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

interface DatingContextType {
  currentUser: User | null;
  currentProfile: Profile | null;
  activeTab: 'discovery' | 'likes' | 'matches' | 'profile';
  setActiveTab: (tab: 'discovery' | 'likes' | 'matches' | 'profile') => void;
  activeChatMatchId: string | null;
  setActiveChatMatchId: (id: string | null) => void;

  // Admin Portal
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  allManagedProfiles: Profile[];
  toggleVerifyUser: (userId: string) => void;
  toggleBanUser: (userId: string) => void;
  reportsList: ReportItem[];
  resolveReport: (reportId: string, action: 'BAN' | 'DISMISS') => void;
  addNewProfile: (profile: Profile) => void;
  updateUserVipStatus: (userId: string, isVip: boolean) => void;
  adminStats: AdminStats;
  
  // Discovery stack & Swipes
  candidateProfiles: Profile[];
  currentCandidate: Profile | null;
  refreshCandidates: () => Promise<void>;
  swipes: SwipeRecord[];
  swipe: (action: SwipeAction) => void;
  rewindLastSwipe: () => boolean;
  canRewind: boolean;
  resetSwipeHistoryForCurrentUser: () => Promise<void>;
  
  // Matches & Chat
  matches: Match[];
  messages: Record<string, Message[]>;
  sendMessage: (matchId: string, content: string, type?: 'TEXT' | 'IMAGE', imageUrl?: string) => void;
  activeMatchModal: Profile | null;
  closeMatchModal: () => void;
  
  // Likes You
  likedMeProfiles: Profile[];
  
  // Modals & Sheets
  detailProfileModal: Profile | null;
  setDetailProfileModal: (profile: Profile | null) => void;
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: (open: boolean) => void;
  isPremiumModalOpen: boolean;
  setIsPremiumModalOpen: (open: boolean) => void;
  isEditProfileModalOpen: boolean;
  setIsEditProfileModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (open: boolean) => void;
  blockReportModal: { target: Profile; type: 'BLOCK' | 'REPORT' } | null;
  setBlockReportModal: (val: { target: Profile; type: 'BLOCK' | 'REPORT' } | null) => void;
  
  // Boost & Premium
  activateBoost: () => boolean;
  isBoostActive: boolean;
  boostTimeRemaining: number;
  upgradePremium: (tier: '1_month' | '3_months' | '6_months' | '12_months') => void;
  
  // Filters
  filters: FilterState;
  updateFilters: (newFilters: Partial<FilterState>) => void;
  
  // Auth & Onboarding
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: (data: Partial<Profile>) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  
  // Safety actions
  blockUser: (targetId: string) => void;
  reportUser: (targetId: string, reason: string) => void;
  resetAllData: () => void;
  
  // Toasts
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // DB Sync state
  isDbConnected: boolean;
}

const DatingContext = createContext<DatingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'cupid_user_v1',
  PROFILE: 'cupid_profile_v1',
  SWIPES: 'cupid_swipes_v1',
  MATCHES: 'cupid_matches_v1',
  MESSAGES: 'cupid_messages_v1',
  BLOCKED: 'cupid_blocked_v1',
  FILTERS: 'cupid_filters_v1',
};

const DEFAULT_FILTERS: FilterState = {
  gender: 'BOTH',
  minAge: 18,
  maxAge: 40,
  maxDistance: 50,
  selectedInterests: [],
  verifiedOnly: false,
};

export const DatingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Auth state
  // Never restore a client-side identity as proof of authentication. Firebase restores
  // the real session; the server then reloads the matching profile from PostgreSQL.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  // 2. Navigation tabs
  const [activeTab, setActiveTab] = useState<'discovery' | 'likes' | 'matches' | 'profile'>('discovery');
  const [activeChatMatchId, setActiveChatMatchId] = useState<string | null>(null);

  // 3. Swipes & History
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);

  const [swipeHistory, setSwipeHistory] = useState<{ profile: Profile; action: SwipeAction }[]>([]);

  // 4. Matches
  const [matches, setMatches] = useState<Match[]>([]);

  // 5. Messages
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  // 6. Blocked users
  const [blockedIds, setBlockedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BLOCKED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 7. Filters
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FILTERS);
      return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  // 8. Modals
  const [activeMatchModal, setActiveMatchModal] = useState<Profile | null>(null);
  const [detailProfileModal, setDetailProfileModal] = useState<Profile | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [blockReportModal, setBlockReportModal] = useState<{ target: Profile; type: 'BLOCK' | 'REPORT' } | null>(null);

  // Admin Management State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [allManagedProfiles, setAllManagedProfiles] = useState<Profile[]>([]);

  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    premiumUsers: 0,
    totalSwipes: 0,
    totalMatches: 0,
    pendingReports: 0,
    estimatedRevenue: 0,
  });

  const [isDbConnected, setIsDbConnected] = useState(false);

  // 9. Candidate profiles from Cloud SQL
  const [candidateProfiles, setCandidateProfiles] = useState<Profile[]>([]);
  const [likedMeProfiles, setLikedMeProfiles] = useState<Profile[]>([]);

  // 10. Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Real-time WebSocket connection for live messaging
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = async () => {
      try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        const token = await firebaseUser.getIdToken();
        if (disposed) return;
        ws = new WebSocket(wsUrl, ['cupidgo-v1', `firebase.${token}`]);
        wsRef.current = ws;

        ws.onopen = () => {
          // WebSocket readiness does not prove PostgreSQL is healthy.
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_MESSAGE' && data.message) {
              const msg: Message = data.message;
              setMessages((prev) => ({
                ...prev,
                [msg.matchId]: [...(prev[msg.matchId] || []).filter((m) => m.id !== msg.id), msg],
              }));
              setMatches((prev) =>
                prev.map((m) =>
                  m.id === msg.matchId
                    ? {
                        ...m,
                        lastMessage: msg.type === 'IMAGE' ? '📷 [Hình ảnh]' : msg.content,
                        lastMessageTime: 'Vừa xong',
                        unreadCount: m.id === activeChatMatchId ? 0 : (m.unreadCount || 0) + 1,
                      }
                    : m
                )
              );
            } else if (data.type === 'MESSAGE_DELIVERED') {
              const { messageId, matchId } = data;
              setMessages((prev) => ({
                ...prev,
                [matchId]: (prev[matchId] || []).map((m) =>
                  m.id === messageId ? { ...m, status: 'delivered' } : m
                ),
              }));
            } else if (data.type === 'MESSAGES_READ') {
              const { matchId } = data;
              setMessages((prev) => ({
                ...prev,
                [matchId]: (prev[matchId] || []).map((m) =>
                  m.senderId === currentUser.id ? { ...m, status: 'read', isRead: true } : m
                ),
              }));
            }
          } catch (e) {
            console.warn('WS message parse error:', e);
          }
        };

        ws.onclose = () => {
          if (!disposed) reconnectTimeout = setTimeout(() => { void connect(); }, 3000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (e) {
        console.warn('WebSocket connect error:', e);
      }
    };

    void connect();

    return () => {
      disposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      wsRef.current = null;
    };
  }, [currentUser?.id]);

  // Safe helper to write to localStorage without crashing on QuotaExceededError
  const safeSetStorage = useCallback((key: string, value: any) => {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (err: any) {
      // If quota is exceeded, clear non-essential bulky caches to free space
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        try {
          localStorage.removeItem(STORAGE_KEYS.MATCHES);
          localStorage.removeItem(STORAGE_KEYS.MESSAGES);
          localStorage.removeItem('cupid_managed_profiles_v1');
        } catch {}
      }
    }
  }, []);

  // Sync state to LocalStorage as cache with quota-safe protection
  useEffect(() => {
    if (currentUser) safeSetStorage(STORAGE_KEYS.USER, currentUser);
    else {
      try { localStorage.removeItem(STORAGE_KEYS.USER); } catch {}
    }
  }, [currentUser, safeSetStorage]);

  useEffect(() => {
    if (currentProfile) {
      // Strip large data URLs from cache to keep storage light (full data is in PostgreSQL)
      const compactProfile = {
        ...currentProfile,
        photos: (currentProfile.photos || []).map((p) =>
          typeof p === 'string' && p.startsWith('data:') && p.length > 50000 ? p.substring(0, 80) : p
        ),
      };
      safeSetStorage(STORAGE_KEYS.PROFILE, compactProfile);
    } else {
      try { localStorage.removeItem(STORAGE_KEYS.PROFILE); } catch {}
    }
  }, [currentProfile, safeSetStorage]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.SWIPES, swipes.slice(-50));
  }, [swipes, safeSetStorage]);

  useEffect(() => {
    // Keep matches cache compact to prevent QuotaExceededError
    const compactMatches = matches.slice(0, 15).map((m) => ({
      ...m,
      partnerProfile: {
        ...m.partnerProfile,
        photos: (m.partnerProfile?.photos || []).map((p) =>
          typeof p === 'string' && p.startsWith('data:') && p.length > 50000 ? p.substring(0, 80) : p
        ),
      },
    }));
    safeSetStorage(STORAGE_KEYS.MATCHES, compactMatches);
  }, [matches, safeSetStorage]);

  useEffect(() => {
    const compactMessages: Record<string, Message[]> = {};
    Object.keys(messages).forEach((k) => {
      compactMessages[k] = (messages[k] || []).slice(-10);
    });
    safeSetStorage(STORAGE_KEYS.MESSAGES, compactMessages);
  }, [messages, safeSetStorage]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.BLOCKED, blockedIds);
  }, [blockedIds, safeSetStorage]);

  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.FILTERS, filters);
  }, [filters, safeSetStorage]);

  // Load only real profiles from the authenticated PostgreSQL API.
  const loadCandidatesFromDb = useCallback(async (_userId?: string) => {
    if (!currentUser?.id) return;
    try {
      const res = await apiFetch('/api/profiles/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      if (!res.ok) throw new Error(`Candidate API returned ${res.status}`);
      const data = await res.json();
      setCandidateProfiles(Array.isArray(data.candidates) ? data.candidates : []);
      setIsDbConnected(true);
    } catch (error) {
      console.error('Could not load verified candidate profiles:', error);
      setCandidateProfiles([]);
      setIsDbConnected(false);
      showToast('Không tải được hồ sơ thật. Hãy kiểm tra kết nối cơ sở dữ liệu.');
    }
  }, [currentUser?.id, filters, showToast]);

  // Load matches from Cloud SQL database
  const loadMatchesFromDb = useCallback(async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;
    try {
      const res = await apiFetch('/api/matches');
      if (!res.ok) throw new Error(`Matches API returned ${res.status}`);
      const data = await res.json();
      setMatches(Array.isArray(data.matches) ? data.matches : []);
    } catch (err) {
      console.warn('Failed to load matches from DB:', err);
      setMatches([]);
    }
  }, [currentUser?.id]);

  // Load liked me profiles from Cloud SQL database
  const loadLikesFromDb = useCallback(async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;
    try {
      const res = await apiFetch('/api/profiles/liked-me');
      if (!res.ok) throw new Error(`Likes API returned ${res.status}`);
      const data = await res.json();
      setLikedMeProfiles(Array.isArray(data.likes) ? data.likes : []);
    } catch (err) {
      console.warn('Failed to load likes from DB:', err);
      setLikedMeProfiles([]);
    }
  }, [currentUser?.id]);

  // Load Admin Data from Cloud SQL database
  const loadAdminData = useCallback(async () => {
    try {
      const [statsRes, profRes, repRes] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/profiles'),
        apiFetch('/api/admin/reports'),
      ]);
      if (statsRes.ok) {
        const s = await statsRes.json();
        if (s.stats) setAdminStats(s.stats);
      }
      if (profRes.ok) {
        const p = await profRes.json();
        if (p.profiles) setAllManagedProfiles(p.profiles);
      }
      if (repRes.ok) {
        const r = await repRes.json();
        if (r.reports) setReportsList(r.reports);
      }
    } catch (err) {
      console.warn('Failed to load admin data from DB:', err);
    }
  }, []);

  // Fetch initial data on user change or tab change
  useEffect(() => {
    if (currentUser) {
      loadCandidatesFromDb(currentUser.id);
      loadMatchesFromDb(currentUser.id);
      loadLikesFromDb(currentUser.id);
    }
  }, [currentUser?.id, loadCandidatesFromDb, loadMatchesFromDb, loadLikesFromDb]);

  useEffect(() => {
    if (isAdminMode) {
      loadAdminData();
    }
  }, [isAdminMode, loadAdminData]);

  // Boost timer management
  const [boostTimeRemaining, setBoostTimeRemaining] = useState<number>(0);
  const isBoostActive = boostTimeRemaining > 0;

  useEffect(() => {
    if (!currentUser?.boostActiveUntil) {
      setBoostTimeRemaining(0);
      return;
    }
    const checkBoost = () => {
      const diff = Math.max(0, Math.floor((new Date(currentUser.boostActiveUntil!).getTime() - Date.now()) / 1000));
      setBoostTimeRemaining(diff);
      if (diff === 0 && currentUser.boostActiveUntil) {
        setCurrentUser(prev => prev ? { ...prev, boostActiveUntil: undefined } : null);
      }
    };
    checkBoost();
    const interval = setInterval(checkBoost, 1000);
    return () => clearInterval(interval);
  }, [currentUser?.boostActiveUntil]);

  const currentCandidate = candidateProfiles[0] || null;

  // Swipe and matching decisions are made by PostgreSQL; do not fabricate local matches on API failure.
  const swipe = async (action: SwipeAction) => {
    if (!currentCandidate || !currentUser) return;

    const target = currentCandidate;
    const swipeId = `pending_${Date.now()}`;
    setSwipes((prev) => [...prev, {
      id: swipeId,
      swiperId: currentUser.id,
      targetId: target.userId,
      action,
      createdAt: new Date().toISOString(),
    }]);
    setSwipeHistory((prev) => [...prev, { profile: target, action }]);
    setCandidateProfiles((prev) => prev.filter((profile) => profile.userId !== target.userId));

    try {
      const res = await apiFetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: target.userId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || `Swipe API returned ${res.status}`);

      if (data.isMatch) {
        await loadMatchesFromDb(currentUser.id);
        setActiveMatchModal(target);
        try {
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: ['#FF4458', '#FE6B8B', '#FFD700', '#FF758C'] });
        } catch {}
      } else if (action === 'SUPER_LIKE') {
        showToast(`Đã gửi Siêu Thích cho ${target.displayName}.`);
      }
    } catch (error) {
      console.error('Swipe persistence failed:', error);
      setSwipes((prev) => prev.filter((swipeRecord) => swipeRecord.id !== swipeId));
      setSwipeHistory((prev) => prev.filter((record) => record.profile.userId !== target.userId));
      setCandidateProfiles((prev) => [target, ...prev.filter((profile) => profile.userId !== target.userId)]);
      showToast('Không lưu được lượt thích. Hãy kiểm tra kết nối rồi thử lại.');
    }
  };

  // Rewind last swipe - Persisted to Cloud SQL
  const canRewind = swipeHistory.length > 0;
  const rewindLastSwipe = (): boolean => {
    if (!canRewind) {
      showToast('Không có lượt vuốt nào để hoàn tác!');
      return false;
    }

    if (!currentUser?.isPremium && (currentUser?.rewindRemaining ?? 0) <= 0) {
      setIsPremiumModalOpen(true);
      return false;
    }

    const last = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));
    setSwipes((prev) => prev.filter((s) => s.targetId !== last.profile.userId));
    setCandidateProfiles((prev) => [last.profile, ...prev]);

    // Send rewind to Cloud SQL
    apiFetch('/api/swipes/rewind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swiperId: currentUser?.id }),
    }).catch(console.warn);

    // Remove match if created
    setMatches((prev) => prev.filter((m) => m.partnerProfile.userId !== last.profile.userId));

    if (!currentUser?.isPremium) {
      setCurrentUser((prev) =>
        prev ? { ...prev, rewindRemaining: Math.max(0, prev.rewindRemaining - 1) } : null
      );
    }

    showToast(`Đã quay lại hồ sơ của ${last.profile.displayName}`);
    return true;
  };

  // Boost Profile
  const activateBoost = (): boolean => {
    if (!currentUser) return false;
    const boostUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    setCurrentUser((prev) => (prev ? { ...prev, boostActiveUntil: boostUntil } : null));

    showToast('⚡ Tăng Tốc đã kích hoạt! Hồ sơ của bạn đang đứng đầu khu vực trong 30 phút.');
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#8B5CF6', '#EC4899', '#3B82F6'],
      });
    } catch {}
    return true;
  };

  // Load chat messages when opening a match & mark incoming as read
  useEffect(() => {
    if (!activeChatMatchId) return;

    apiFetch(`/api/matches/${encodeURIComponent(activeChatMatchId)}/messages`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Messages API returned ${res.status}`);
        setMessages((prev) => ({
          ...prev,
          [activeChatMatchId]: Array.isArray(data.messages) ? data.messages : [],
        }));
      })
      .catch((error) => console.warn('Could not load persisted chat messages:', error));

    // Mark as read in backend
    if (currentUser?.id) {
      apiFetch(`/api/matches/${activeChatMatchId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerId: currentUser.id }),
      }).catch(console.warn);
    }
  }, [activeChatMatchId, currentUser?.id]);

  // Persist the message once through the authenticated API. The server broadcasts the saved row.
  const sendMessage = async (
    matchId: string,
    content: string,
    type: 'TEXT' | 'IMAGE' = 'TEXT',
    imageUrl?: string
  ) => {
    if (!currentUser) return;
    const tempId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimistic: Message = {
      id: tempId,
      matchId,
      senderId: currentUser.id,
      content,
      type,
      imageUrl,
      isRead: false,
      status: 'sending',
      sentAt: new Date().toISOString(),
    };
    setMessages((previous) => ({ ...previous, [matchId]: [...(previous[matchId] || []), optimistic] }));

    try {
      const response = await apiFetch(`/api/matches/${encodeURIComponent(matchId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, imageUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.message) {
        throw new Error(data.message || data.error || `Gửi tin nhắn thất bại (${response.status}).`);
      }
      const savedMessage = data.message as Message;
      setMessages((previous) => ({
        ...previous,
        [matchId]: (previous[matchId] || []).map((message) => message.id === tempId ? savedMessage : message),
      }));
      setMatches((previous) => previous.map((match) => match.id === matchId ? {
        ...match,
        lastMessage: type === 'IMAGE' ? '📷 [Hình ảnh]' : content,
        lastMessageTime: savedMessage.sentAt,
      } : match));
    } catch (error) {
      setMessages((previous) => ({
        ...previous,
        [matchId]: (previous[matchId] || []).filter((message) => message.id !== tempId),
      }));
      console.error('Message persistence failed:', error);
      showToast('Không gửi được tin nhắn. Hãy kiểm tra kết nối rồi thử lại.');
    }
  };

  const closeMatchModal = () => {
    setActiveMatchModal(null);
  };

  // Block & Report - Persisted to Cloud SQL
  const blockUser = async (targetId: string) => {
    setBlockedIds((prev) => [...prev, targetId]);
    setSwipes((prev) => prev.filter((s) => s.targetId !== targetId));
    setMatches((prev) => prev.filter((m) => m.partnerProfile.userId !== targetId));
    setDetailProfileModal(null);
    setBlockReportModal(null);

    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser?.id,
          reportedId: targetId,
          type: 'BLOCK',
          reason: 'Chặn người dùng',
        }),
      });
    } catch {}

    showToast('Đã chặn người dùng thành công.');
  };

  const reportUser = async (targetId: string, reason: string) => {
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser?.id,
          reportedId: targetId,
          type: 'REPORT',
          reason,
        }),
      });
    } catch {}

    blockUser(targetId);
    showToast(`Đã gửi báo cáo vi phạm: "${reason}". Cảm ơn bạn đã giữ an toàn cho cộng đồng!`);
  };

  // Filters
  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      return updated;
    });
    showToast('Đã cập nhật bộ lọc khám phá.');
  };

  // Sync a verified Firebase account with the existing PostgreSQL user/profile records.
  const syncFirebaseUser = useCallback(async (firebaseUser: FirebaseUser) => {
    await reload(firebaseUser);
    if (!firebaseUser.emailVerified || !firebaseUser.email) {
      setCurrentUser(null);
      setCurrentProfile(null);
      return false;
    }

    const token = await firebaseUser.getIdToken(true);
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phoneNumber: firebaseUser.phoneNumber || undefined }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.user) {
      throw new Error(data.message || data.error || `Đồng bộ tài khoản thất bại (${response.status}).`);
    }

    const syncedUser: User = {
      id: data.user.uid,
      email: data.user.email,
      phoneNumber: data.user.phoneNumber || firebaseUser.phoneNumber || undefined,
      isPremium: Boolean(data.user.isPremium),
      premiumTier: data.user.premiumTier || undefined,
      premiumExpiry: data.user.premiumExpiry || undefined,
      isCompleted: Boolean(data.user.isCompleted || data.profile),
      superLikesRemaining: data.user.superLikesRemaining ?? 5,
      rewindRemaining: data.user.rewindRemaining ?? 3,
      boostActiveUntil: data.user.boostActiveUntil || undefined,
      createdAt: data.user.createdAt ? new Date(data.user.createdAt).toISOString() : new Date().toISOString(),
    };

    setCurrentUser(syncedUser);
    setCurrentProfile(data.profile || null);
    setIsDbConnected(true);
    return true;
  }, []);

  // Restore only a real Firebase session after refreshing Firebase's server-side user state.
  useEffect(() => {
    const clearSignedInState = () => {
      setCurrentUser(null);
      setCurrentProfile(null);
      setCandidateProfiles([]);
      setLikedMeProfiles([]);
      setMatches([]);
      setMessages({});
      setSwipes([]);
      setIsAdminMode(false);
      setIsDbConnected(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        clearSignedInState();
        return;
      }

      void (async () => {
        try {
          await reload(firebaseUser);
          if (!firebaseUser.emailVerified || !firebaseUser.email) {
            clearSignedInState();
            await signOut(auth).catch(() => undefined);
            return;
          }
          await syncFirebaseUser(firebaseUser);
        } catch (error) {
          console.error('Firebase session sync failed:', error);
          clearSignedInState();
          showToast('Không thể tải tài khoản từ máy chủ. Hãy kiểm tra kết nối dữ liệu và đăng nhập lại.');
          try { await signOut(auth); } catch {}
        }
      })();
    });
    return unsubscribe;
  }, [showToast, syncFirebaseUser]);

  // Email/password login uses Firebase Authentication, never a client-generated UID.
  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    await reload(credential.user);
    if (!credential.user.emailVerified) {
      try { await sendEmailVerification(credential.user); } catch (error) {
        console.warn('Could not resend Firebase verification email:', error);
      }
      await signOut(auth);
      setCurrentUser(null);
      setCurrentProfile(null);
      showToast('Email chưa được xác minh. Hãy mở liên kết trong hộp thư rồi đăng nhập lại.');
      return;
    }
    try {
      await syncFirebaseUser(credential.user);
      showToast('Đăng nhập thành công.');
    } catch (error) {
      setCurrentUser(null);
      setCurrentProfile(null);
      await signOut(auth).catch(() => undefined);
      throw error;
    }
  };

  // Google sign-in follows the same verified Firebase ID-token path.
  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    await reload(credential.user);
    if (!credential.user.emailVerified) {
      await signOut(auth);
      throw new Error('Tài khoản Google chưa có email được xác minh.');
    }
    try {
      await syncFirebaseUser(credential.user);
      showToast(`Chào mừng ${credential.user.displayName || credential.user.email || 'bạn'}!`);
    } catch (error) {
      setCurrentUser(null);
      setCurrentProfile(null);
      await signOut(auth).catch(() => undefined);
      throw error;
    }
  };

  // Create account in Firebase and require clicking the real verification link before use.
  const register = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    try {
      await sendEmailVerification(credential.user);
    } finally {
      await signOut(auth).catch(() => undefined);
      setCurrentUser(null);
      setCurrentProfile(null);
    }
    showToast('Đã gửi liên kết xác minh đến email. Hãy xác minh trước khi đăng nhập.');
  };

  const logout = () => {
    void signOut(auth).catch((error) => console.warn('Firebase sign-out failed:', error));
    setCurrentUser(null);
    setCurrentProfile(null);
    setActiveTab('discovery');
    setActiveChatMatchId(null);
    setMatches([]);
    setMessages({});
    setSwipes([]);
    setCandidateProfiles([]);
    setLikedMeProfiles([]);
    setIsAdminMode(false);
    setIsDbConnected(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.MATCHES);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.SWIPES);
    } catch {}
  };

  // Persist the profile before switching the user into the main app.
  const completeOnboarding = async (data: Partial<Profile>) => {
    if (!currentUser) return;

    const completedProfile: Profile = {
      userId: currentUser.id,
      displayName: data.displayName?.trim() || '',
      gender: data.gender || 'OTHER',
      birthDate: data.birthDate || '',
      age: data.age || 0,
      bio: data.bio || '',
      photos: data.photos || [],
      locationName: data.locationName || 'Việt Nam',
      latitude: data.latitude ?? 10.7769,
      longitude: data.longitude ?? 106.7009,
      distanceKm: 0,
      targetGender: data.targetGender || 'BOTH',
      minAgePref: data.minAgePref || 18,
      maxAgePref: data.maxAgePref || 50,
      maxDistancePref: data.maxDistancePref || 50,
      interests: data.interests || [],
      lookingFor: data.lookingFor || 'Hẹn hò tìm hiểu',
      jobTitle: data.jobTitle,
      company: data.company,
      education: data.education,
      zodiac: data.zodiac,
      heightCm: data.heightCm,
      lifestyle: data.lifestyle || {},
      compatibilityRate: 0,
      isVerified: false,
    };

    try {
      const res = await apiFetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedProfile),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.profile) {
        throw new Error(result.message || result.error || `Không lưu được hồ sơ (${res.status}).`);
      }
      setCurrentProfile(result.profile);
      setCurrentUser((prev) => (prev ? { ...prev, isCompleted: true } : null));
      setActiveTab('discovery');
      setIsDbConnected(true);
      showToast('Đã lưu hồ sơ vào cơ sở dữ liệu.');
      await loadCandidatesFromDb(currentUser.id);
    } catch (error) {
      console.error('Profile onboarding save failed:', error);
      showToast('Không lưu được hồ sơ. Hãy kiểm tra kết nối cơ sở dữ liệu rồi thử lại.');
    }
  };

  // Save profile edits to PostgreSQL and only report success when the API confirms.
  const updateProfile = async (data: Partial<Profile>) => {
    if (!currentUser || !currentProfile) return;
    const previousProfile = currentProfile;
    const updatedData = { ...currentProfile, ...data, userId: currentUser.id };
    setCurrentProfile(updatedData);

    try {
      const response = await apiFetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.profile) {
        throw new Error(result.message || result.error || `Không lưu được hồ sơ (${response.status}).`);
      }
      setCurrentProfile(result.profile);
      showToast('Đã lưu thay đổi hồ sơ.');
    } catch (error) {
      setCurrentProfile(previousProfile);
      console.error('Profile update failed:', error);
      showToast('Không lưu được hồ sơ. Vui lòng kiểm tra kết nối rồi thử lại.');
    }
  };

  // Premium cannot be granted by a client-side click; payment verification must be integrated first.
  const upgradePremium = (_tier: '1_month' | '3_months' | '6_months' | '12_months') => {
    setIsPremiumModalOpen(false);
    showToast('Thanh toán VIP chưa được tích hợp. Tài khoản chưa bị tính phí và chưa được nâng cấp.');
  };

  // Admin Actions - All Persist directly to Cloud SQL!
  const toggleVerifyUser = async (userId: string) => {
    setAllManagedProfiles((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, isVerified: !p.isVerified } : p))
    );

    try {
      const res = await apiFetch(`/api/admin/users/${userId}/verify`, { method: 'POST' });
      const data = await res.json();
      showToast(`Đã ${data.isVerified ? 'xác thực tick xanh' : 'hủy xác thực'} trong CSDL SQL.`);
    } catch {
      showToast('Cập nhật trạng thái xác thực');
    }
  };

  const toggleBanUser = async (userId: string) => {
    setAllManagedProfiles((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, isBanned: !p.isBanned } : p))
    );

    try {
      const res = await apiFetch(`/api/admin/users/${userId}/ban`, { method: 'POST' });
      const data = await res.json();
      showToast(`Đã ${data.isBanned ? 'khóa tài khoản' : 'mở khóa'} trong CSDL SQL.`);
    } catch {
      showToast('Cập nhật trạng thái tài khoản');
    }
  };

  const updateUserVipStatus = async (userId: string, isVip: boolean) => {
    setAllManagedProfiles((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, hasLikedCurrentUser: isVip } : p))
    );

    try {
      await apiFetch(`/api/admin/users/${userId}/vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVip }),
      });
      showToast(`Đã cập nhật trạng thái VIP trong CSDL SQL.`);
    } catch {}
  };

  const resolveReport = async (reportId: string, action: 'BAN' | 'DISMISS') => {
    setReportsList((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: action === 'BAN' ? 'RESOLVED' : 'DISMISSED',
              actionTaken: action === 'BAN' ? 'Đã khóa tài khoản' : 'Bỏ qua',
            }
          : r
      )
    );

    try {
      await apiFetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      showToast(`Đã xử lý báo cáo trong CSDL SQL.`);
    } catch {}
  };

  const addNewProfile = async (profile: Profile) => {
    try {
      const res = await apiFetch('/api/admin/profiles/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.profile) {
        throw new Error(data.error || `Không thể lưu hồ sơ (${res.status}).`);
      }
      setAllManagedProfiles((prev) => [data.profile, ...prev.filter((item) => item.userId !== data.profile.userId)]);
      await loadAdminData();
      showToast('Đã cập nhật hồ sơ tài khoản đã xác minh.');
    } catch (error) {
      console.warn('Admin profile operation failed:', error);
      showToast(error instanceof Error ? error.message : 'Không thể lưu hồ sơ.');
    }
  };

  // Reset swipe history for current user so they can rediscover real candidate profiles without affecting their personal data
  const resetSwipeHistoryForCurrentUser = async () => {
    if (!currentUser) return;
    try {
      await apiFetch('/api/swipes/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swiperId: currentUser.id }),
      });
      setSwipes([]);
      setSwipeHistory([]);
      try {
        localStorage.removeItem(STORAGE_KEYS.SWIPES);
      } catch {}
      await loadCandidatesFromDb(currentUser.id);
      showToast('Đã làm mới danh sách khám phá. Bạn có thể xem lại các hồ sơ!');
    } catch (err) {
      console.warn('Failed to reset swipes:', err);
      showToast('Không thể làm mới danh sách lúc này.');
    }
  };

  // Reset local app filters & cache without overwriting the authenticated real user
  const resetAllData = () => {
    setSwipes([]);
    setSwipeHistory([]);
    setFilters(DEFAULT_FILTERS);
    if (currentUser?.id) {
      loadCandidatesFromDb(currentUser.id);
    }
    showToast('Đã đặt lại bộ lọc và làm mới danh sách.');
  };

  return (
    <DatingContext.Provider
      value={{
        currentUser,
        currentProfile,
        activeTab,
        setActiveTab,
        activeChatMatchId,
        setActiveChatMatchId,
        isAdminMode,
        setIsAdminMode,
        allManagedProfiles,
        toggleVerifyUser,
        toggleBanUser,
        reportsList,
        resolveReport,
        addNewProfile,
        updateUserVipStatus,
        adminStats,
        candidateProfiles,
        currentCandidate,
        refreshCandidates: async () => {
          await loadCandidatesFromDb();
        },
        swipes,
        swipe,
        rewindLastSwipe,
        canRewind,
        resetSwipeHistoryForCurrentUser,
        matches,
        messages,
        sendMessage,
        activeMatchModal,
        closeMatchModal,
        likedMeProfiles,
        detailProfileModal,
        setDetailProfileModal,
        isFilterModalOpen,
        setIsFilterModalOpen,
        isPremiumModalOpen,
        setIsPremiumModalOpen,
        isEditProfileModalOpen,
        setIsEditProfileModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isDownloadModalOpen,
        setIsDownloadModalOpen,
        blockReportModal,
        setBlockReportModal,
        activateBoost,
        isBoostActive,
        boostTimeRemaining,
        upgradePremium,
        filters,
        updateFilters,
        login,
        loginWithGoogle,
        register,
        logout,
        completeOnboarding,
        updateProfile,
        blockUser,
        reportUser,
        resetAllData,
        toastMessage,
        showToast,
        isDbConnected,
      }}
    >
      {children}
    </DatingContext.Provider>
  );
};

export const useDating = () => {
  const context = useContext(DatingContext);
  if (!context) {
    throw new Error('useDating must be used within a DatingProvider');
  }
  return context;
};
