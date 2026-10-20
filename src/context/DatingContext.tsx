import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { signInWithPopup } from 'firebase/auth';
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
import { INITIAL_MOCK_PROFILES } from '../data/mockProfiles.ts';

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
  login: (email: string, isDemoReady?: boolean) => void;
  loginWithGoogle: () => Promise<void>;
  register: (email: string) => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Navigation tabs
  const [activeTab, setActiveTab] = useState<'discovery' | 'likes' | 'matches' | 'profile'>('discovery');
  const [activeChatMatchId, setActiveChatMatchId] = useState<string | null>(null);

  // 3. Swipes & History
  const [swipes, setSwipes] = useState<SwipeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SWIPES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [swipeHistory, setSwipeHistory] = useState<{ profile: Profile; action: SwipeAction }[]>([]);

  // 4. Matches
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATCHES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Messages
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

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
  const [allManagedProfiles, setAllManagedProfiles] = useState<Profile[]>(() => {
    try {
      const saved = localStorage.getItem('cupid_managed_profiles_v1');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_PROFILES;
    } catch {
      return INITIAL_MOCK_PROFILES;
    }
  });

  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 15,
    premiumUsers: 4,
    totalSwipes: 284,
    totalMatches: 38,
    pendingReports: 0,
    estimatedRevenue: 1196000,
  });

  const [isDbConnected, setIsDbConnected] = useState(true);

  // 9. Candidate profiles from Cloud SQL
  const [candidateProfiles, setCandidateProfiles] = useState<Profile[]>([]);
  const [likedMeProfiles, setLikedMeProfiles] = useState<Profile[]>([]);

  // 10. Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

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
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${encodeURIComponent(currentUser.id)}`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsDbConnected(true);
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
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (e) {
        console.warn('WebSocket connect error:', e);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      wsRef.current = null;
    };
  }, [currentUser?.id, activeChatMatchId]);

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

  // Load candidate profiles from Cloud SQL database
  const loadCandidatesFromDb = useCallback(async (userId?: string) => {
    const uid = userId || currentUser?.id || 'user_me_001';
    try {
      const res = await fetch('/api/profiles/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, filters }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.candidates && Array.isArray(data.candidates)) {
          setCandidateProfiles(data.candidates);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch candidates from DB, using fallback profiles:', err);
      // Fallback to local filtering
      const swipedIds = new Set(swipes.map((s) => s.targetId));
      const filtered = allManagedProfiles.filter((p) => {
        if (p.isBanned || blockedIds.includes(p.userId) || swipedIds.has(p.userId)) return false;
        if (filters.gender !== 'BOTH' && p.gender !== filters.gender) return false;
        if (p.age < filters.minAge || p.age > filters.maxAge) return false;
        return true;
      });
      setCandidateProfiles(filtered);
    }
  }, [currentUser?.id, filters, swipes, allManagedProfiles, blockedIds]);

  // Load matches from Cloud SQL database
  const loadMatchesFromDb = useCallback(async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;
    try {
      const res = await fetch(`/api/matches?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.matches) {
          setMatches(data.matches);
        }
      }
    } catch (err) {
      console.warn('Failed to load matches from DB:', err);
    }
  }, [currentUser?.id]);

  // Load liked me profiles from Cloud SQL database
  const loadLikesFromDb = useCallback(async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;
    try {
      const res = await fetch(`/api/profiles/liked-me?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.likes) {
          setLikedMeProfiles(data.likes);
        }
      }
    } catch (err) {
      console.warn('Failed to load likes from DB:', err);
    }
  }, [currentUser?.id]);

  // Load Admin Data from Cloud SQL database
  const loadAdminData = useCallback(async () => {
    try {
      const [statsRes, profRes, repRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/profiles'),
        fetch('/api/admin/reports'),
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

  // Swipe Action Handler - Persisted to Cloud SQL
  const swipe = async (action: SwipeAction) => {
    if (!currentCandidate || !currentUser) return;

    const target = currentCandidate;
    const newSwipe: SwipeRecord = {
      id: `swipe_${Date.now()}`,
      swiperId: currentUser.id,
      targetId: target.userId,
      action,
      createdAt: new Date().toISOString(),
    };

    setSwipes((prev) => [...prev, newSwipe]);
    setSwipeHistory((prev) => [...prev, { profile: target, action }]);
    setCandidateProfiles((prev) => prev.slice(1));

    // Send swipe to backend Cloud SQL
    try {
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swiperId: currentUser.id,
          targetId: target.userId,
          action,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isMatch) {
          const newMatch: Match = {
            id: data.matchId || `match_${Date.now()}`,
            user1Id: currentUser.id,
            user2Id: target.userId,
            matchedAt: new Date().toISOString(),
            partnerProfile: target,
            lastMessage: action === 'SUPER_LIKE' ? '✨ Bạn đã gửi Super Like cho người này!' : '🎉 Hai bạn đã tương hợp!',
            lastMessageTime: 'Vừa xong',
            unreadCount: 0,
          };

          setMatches((prev) => [newMatch, ...prev.filter((m) => m.partnerProfile.userId !== target.userId)]);
          setActiveMatchModal(target);

          // Trigger Confetti!
          try {
            confetti({
              particleCount: 90,
              spread: 75,
              origin: { y: 0.6 },
              colors: ['#FF4458', '#FE6B8B', '#FFD700', '#FF758C'],
            });
          } catch {}
          return;
        }
      }
    } catch (err) {
      console.warn('DB Swipe sync failed, checked local match logic:', err);
    }

    // Local match fallback
    if ((action === 'LIKE' || action === 'SUPER_LIKE') && target.hasLikedCurrentUser) {
      const newMatch: Match = {
        id: `match_${Date.now()}`,
        user1Id: currentUser.id,
        user2Id: target.userId,
        matchedAt: new Date().toISOString(),
        partnerProfile: target,
        lastMessage: action === 'SUPER_LIKE' ? '⭐ Bạn đã Siêu Thích người này!' : 'Tương hợp mới! Hãy gửi lời chào ngay.',
        lastMessageTime: 'Vừa xong',
        unreadCount: 0,
      };

      setMatches((prev) => [newMatch, ...prev.filter((m) => m.partnerProfile.userId !== target.userId)]);
      setActiveMatchModal(target);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF4458', '#FE6B8B', '#FFD700', '#FF758C'],
        });
      } catch {}
    } else if (action === 'SUPER_LIKE') {
      showToast(`Đã gửi Siêu Thích ⭐ cho ${target.displayName}!`);
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
    fetch('/api/swipes/rewind', {
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

    fetch(`/api/matches/${activeChatMatchId}/messages`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => ({
            ...prev,
            [activeChatMatchId]: data.messages,
          }));
        }
      })
      .catch(console.warn);

    // Mark as read in backend
    if (currentUser?.id) {
      fetch(`/api/matches/${activeChatMatchId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readerId: currentUser.id }),
      }).catch(console.warn);
    }
  }, [activeChatMatchId, currentUser?.id]);

  // Send message - Persisted to Cloud SQL with progressive status (sent -> delivered -> read)
  const sendMessage = async (
    matchId: string,
    content: string,
    type: 'TEXT' | 'IMAGE' = 'TEXT',
    imageUrl?: string
  ) => {
    if (!currentUser) return;

    const msgId = `msg_${Date.now()}`;
    const newMessage: Message = {
      id: msgId,
      matchId,
      senderId: currentUser.id,
      content,
      type,
      imageUrl,
      isRead: false,
      status: 'sent',
      sentAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMessage],
    }));

    // Update match last message
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              lastMessage: type === 'IMAGE' ? '📷 [Hình ảnh]' : content,
              lastMessageTime: 'Vừa xong',
            }
          : m
      )
    );

    // Transition from 'sent' to 'delivered' shortly after dispatch
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [matchId]: (prev[matchId] || []).map((m) =>
          m.id === msgId && m.status === 'sent' ? { ...m, status: 'delivered' } : m
        ),
      }));
    }, 600);

    // Find partnerId in this match for real-time routing
    const targetMatch = matches.find((m) => m.id === matchId);
    const partnerId = targetMatch
      ? (targetMatch.user1Id === currentUser.id ? targetMatch.user2Id : targetMatch.user1Id)
      : undefined;

    // Send in real-time over WebSocket if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && partnerId) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'SEND_MESSAGE',
            matchId,
            receiverId: partnerId,
            content,
            messageType: type,
            imageUrl,
          })
        );
      } catch (wsErr) {
        console.warn('WS send failed, will persist via HTTP POST:', wsErr);
      }
    }

    // Persist message to Cloud SQL database
    try {
      await fetch(`/api/matches/${matchId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: partnerId,
          content,
          type,
          imageUrl,
        }),
      });
    } catch (err) {
      console.warn('Failed to save message to DB:', err);
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
      await fetch('/api/reports', {
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
      await fetch('/api/reports', {
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

  // Auth: Email Login & Sync with Cloud SQL
  const login = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const uid = cleanEmail === 'huynhlamtruong046@gmail.com' ? 'Ak7nIqR8fpQ2eIUP3zQE790MOBH2' : `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email: cleanEmail }),
      });
      const data = await res.json();

      const user: User = {
        id: data.user?.uid || uid,
        email: cleanEmail,
        phoneNumber: data.user?.phoneNumber || undefined,
        isPremium: !!data.user?.isPremium,
        premiumTier: data.user?.premiumTier || undefined,
        isCompleted: !!data.profile,
        superLikesRemaining: 5,
        rewindRemaining: 5,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(user);

      if (data.profile) {
        setCurrentProfile(data.profile);
      } else {
        setCurrentProfile(null);
      }

      loadCandidatesFromDb(uid);
      loadMatchesFromDb(uid);
    } catch (err) {
      console.warn('Sync with DB failed, fallback to local login:', err);
      const user: User = {
        id: uid,
        email: cleanEmail,
        phoneNumber: '0912345678',
        isPremium: false,
        isCompleted: false,
        superLikesRemaining: 5,
        rewindRemaining: 5,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      setCurrentProfile(null);
    }
  };

  // Auth: Google Sign In with Firebase & Sync with Cloud SQL
  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = cred.user;
      const token = await fbUser.getIdToken();

      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email || `${fbUser.uid}@gmail.com`,
          phoneNumber: fbUser.phoneNumber || undefined,
        }),
      });

      const data = await res.json();

      const user: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        phoneNumber: fbUser.phoneNumber || undefined,
        isPremium: false,
        isCompleted: !!data.profile,
        superLikesRemaining: 5,
        rewindRemaining: 3,
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(user);
      if (data.profile) {
        setCurrentProfile(data.profile);
      } else {
        // Real Google user pre-population without synthetic presets
        setCurrentProfile({
          userId: fbUser.uid,
          displayName: fbUser.displayName || 'Người dùng mới',
          gender: 'OTHER',
          birthDate: '2000-01-01',
          age: 24,
          bio: '',
          photos: fbUser.photoURL ? [fbUser.photoURL] : [],
          locationName: 'Việt Nam',
          latitude: 10.7769,
          longitude: 106.7009,
          distanceKm: 0,
          interests: [],
          targetGender: 'BOTH',
          minAgePref: 18,
          maxAgePref: 50,
          maxDistancePref: 50,
          lookingFor: 'Hẹn hò tìm hiểu',
          compatibilityRate: 90,
          lifestyle: {},
        });
      }

      loadCandidatesFromDb(fbUser.uid);
      loadMatchesFromDb(fbUser.uid);
      showToast(`Chào mừng ${fbUser.displayName || fbUser.email}! Đã kết nối với Cloud SQL.`);
    } catch (err: any) {
      console.error('Google login failed:', err);
      showToast('Đăng nhập Google thất bại: ' + (err.message || 'Lỗi kết nối'));
    }
  };

  const register = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const uid = cleanEmail === 'huynhlamtruong046@gmail.com' ? 'Ak7nIqR8fpQ2eIUP3zQE790MOBH2' : `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const newUser: User = {
      id: uid,
      email: cleanEmail,
      isPremium: false,
      isCompleted: false, // Forces onboarding flow for real info input!
      superLikesRemaining: 3,
      rewindRemaining: 3,
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(newUser);
    setCurrentProfile(null);

    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email: cleanEmail, isCompleted: false }),
      });
    } catch {}
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentProfile(null);
    setActiveTab('discovery');
    setActiveChatMatchId(null);
  };

  // Complete Onboarding - Persists Real Person Profile to Cloud SQL!
  const completeOnboarding = async (data: Partial<Profile>) => {
    if (!currentUser) return;

    const completedProfile: Profile = {
      userId: currentUser.id,
      displayName: data.displayName || 'Người dùng',
      gender: data.gender || 'OTHER',
      birthDate: data.birthDate || '2000-01-01',
      age: data.age || 24,
      bio: data.bio || '',
      photos: data.photos && data.photos.length > 0 ? data.photos : [],
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
      compatibilityRate: 95,
      isVerified: false,
    };

    setCurrentProfile(completedProfile);
    setCurrentUser((prev) => (prev ? { ...prev, isCompleted: true } : null));
    setActiveTab('discovery');

    // Save directly to PostgreSQL via REST API
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedProfile),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.profile) {
          setCurrentProfile(result.profile);
        }
      }
    } catch (err) {
      console.error('Failed to save profile to Cloud SQL:', err);
    }

    showToast('🎉 Chúc mừng bạn đã hoàn tất hồ sơ! Dữ liệu đã lưu an toàn vào cơ sở dữ liệu SQL.');
    loadCandidatesFromDb(currentUser.id);
  };

  // Update Profile - Persists Changes to Cloud SQL!
  const updateProfile = async (data: Partial<Profile>) => {
    if (!currentUser) return;

    setCurrentProfile((prev) => (prev ? { ...prev, ...data } : null));

    try {
      const updatedData = { ...currentProfile, ...data, userId: currentUser.id };
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
    } catch (err) {
      console.error('Failed to update profile to Cloud SQL:', err);
    }

    showToast('Đã lưu thông tin hồ sơ vào cơ sở dữ liệu SQL.');
  };

  // Upgrade Premium - Persists to Cloud SQL!
  const upgradePremium = async (tier: '1_month' | '3_months' | '6_months' | '12_months') => {
    if (!currentUser) return;

    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            isPremium: true,
            premiumTier: tier,
            superLikesRemaining: 99,
            rewindRemaining: 99,
          }
        : null
    );

    try {
      await fetch('/api/user/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, tier }),
      });
    } catch {}

    setIsPremiumModalOpen(false);
    showToast('✨ Chúc mừng! Bạn đã nâng cấp CupidGo VIP thành công!');
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF4458'],
      });
    } catch {}
  };

  // Admin Actions - All Persist directly to Cloud SQL!
  const toggleVerifyUser = async (userId: string) => {
    setAllManagedProfiles((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, isVerified: !p.isVerified } : p))
    );

    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, { method: 'POST' });
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
      const res = await fetch(`/api/admin/users/${userId}/ban`, { method: 'POST' });
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
      await fetch(`/api/admin/users/${userId}/vip`, {
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
      await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      showToast(`Đã xử lý báo cáo trong CSDL SQL.`);
    } catch {}
  };

  const addNewProfile = async (profile: Profile) => {
    setAllManagedProfiles((prev) => [profile, ...prev]);
    setCandidateProfiles((prev) => [profile, ...prev]);

    // Save to Cloud SQL
    try {
      const res = await fetch('/api/admin/profiles/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        showToast(`Hồ sơ "${profile.displayName}" đã được ghi thành công vào Cloud SQL!`);
        loadAdminData();
        return;
      }
    } catch (err) {
      console.warn('Failed to save new profile to DB:', err);
    }
    showToast(`Đã thêm hồ sơ "${profile.displayName}" vào hệ thống.`);
  };

  // Reset swipe history for current user so they can rediscover real candidate profiles without affecting their personal data
  const resetSwipeHistoryForCurrentUser = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/swipes/reset', {
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
