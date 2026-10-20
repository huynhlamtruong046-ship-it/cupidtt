import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Shield,
  Crown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  Heart,
  Flame,
  Activity,
  ArrowUpDown,
  FileCode,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { useDating } from '../../context/DatingContext';

interface MetricsData {
  totalAccounts: number;
  totalProfiles: number;
  completedProfiles: number;
  incompleteProfiles: number;
  activeProfiles: number;
  bannedProfiles: number;
  verifiedProfiles: number;
  premiumAccounts: number;
  totalSwipes: number;
  totalMatches: number;
  totalMessages: number;
  lastUpdated: string | null;
  serverTime: string;
}

interface ConnectionHealth {
  status: 'CONNECTED' | 'DISCONNECTED';
  databaseName: string;
  serverVersion: string;
  serverTimestamp: string | null;
  latencyMs: number;
  tableCounts: Record<string, number>;
  healthy: boolean;
  error?: string;
  checkedAt: string;
}

interface UserListItem {
  uid: string;
  email: string;
  phoneNumber: string | null;
  isPremium: boolean;
  premiumTier: string | null;
  isCompletedFlag: boolean;
  displayName: string;
  gender: string;
  age: number | null;
  birthDate: string | null;
  bio: string;
  photos: string[];
  avatar: string | null;
  photosCount: number;
  locationName: string;
  jobTitle: string | null;
  company: string | null;
  isVerified: boolean;
  isBanned: boolean;
  hasProfile: boolean;
  isComplete: boolean;
  userCreatedAt: string | null;
  userUpdatedAt: string | null;
  profileUpdatedAt: string | null;
}

interface UserDetailData {
  user: {
    uid: string;
    email: string;
    phoneNumber: string | null;
    isPremium: boolean;
    premiumTier: string | null;
    premiumExpiry: string | null;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  profile: {
    id: number;
    userId: string;
    displayName: string;
    gender: string;
    birthDate: string;
    age: number;
    bio: string;
    photos: string[];
    locationName: string;
    latitude: string;
    longitude: string;
    targetGender: string;
    minAgePref: number;
    maxAgePref: number;
    maxDistancePref: number;
    interests: string[];
    lookingFor: string;
    jobTitle: string | null;
    company: string | null;
    education: string | null;
    zodiac: string | null;
    heightCm: number | null;
    lifestyle: Record<string, any>;
    prompts: any[];
    compatibilityRate: number;
    isVerified: boolean;
    isBanned: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  stats: {
    swipesSent: number;
    swipesReceived: number;
    matchesCount: number;
  };
}

export const DataManagement: React.FC = () => {
  const { currentUser, showToast } = useDating();

  // State
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [health, setHealth] = useState<ConnectionHealth | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED' | 'VERIFIED' | 'VIP' | 'COMPLETED' | 'INCOMPLETE' | 'NO_PROFILE'>('ALL');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected User Detail Modal
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'profile' | 'raw_json'>('profile');

  // Copy feedback
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Auth header generator
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'x-admin-email': currentUser?.email || 'huynhlamtruong046@gmail.com',
    };
  }, [currentUser]);

  // Fetch metrics & health
  const fetchOverview = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [healthRes, metricsRes] = await Promise.all([
        fetch('/api/admin/data-management/health', { headers }),
        fetch('/api/admin/data-management/metrics', { headers }),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      } else {
        setHealth({
          status: 'DISCONNECTED',
          databaseName: 'cloud_sql_development_database',
          serverVersion: 'Unknown',
          serverTimestamp: null,
          latencyMs: 0,
          tableCounts: {},
          healthy: false,
          error: 'Không thể kết nối đến cơ sở dữ liệu Cloud SQL',
          checkedAt: new Date().toISOString(),
        });
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (err: any) {
      console.error('Error fetching overview:', err);
    }
  }, [getAuthHeaders]);

  // Fetch users list
  const fetchUsers = useCallback(async (page = 1, search = searchTerm, status = statusFilter) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const headers = getAuthHeaders();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: search.trim(),
        status,
      });

      const res = await fetch(`/api/admin/data-management/users?${params.toString()}`, { headers });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Lỗi tải danh sách người dùng`);
      }

      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setErrorMessage(err.message || 'Lỗi kết nối cơ sở dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, searchTerm, statusFilter]);

  // Initial load
  useEffect(() => {
    fetchOverview();
    fetchUsers(1);
  }, [fetchOverview, fetchUsers]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchOverview(), fetchUsers(pagination.page)]);
    setIsRefreshing(false);
    showToast('Đã làm mới dữ liệu từ Cloud SQL PostgreSQL');
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchTerm, statusFilter);
  };

  // Status filter switch
  const handleStatusChange = (newStatus: typeof statusFilter) => {
    setStatusFilter(newStatus);
    fetchUsers(1, searchTerm, newStatus);
  };

  // Open User Detail
  const handleOpenDetail = async (uid: string) => {
    setSelectedUid(uid);
    setIsLoadingDetail(true);
    setDetailTab('profile');
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/data-management/users/${uid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUserDetail(data);
      } else {
        showToast('Không thể tải chi tiết người dùng');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi truy vấn chi tiết người dùng');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Quick Action: Toggle Ban
  const handleToggleBan = async (uid: string, currentBan: boolean) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/data-management/users/${uid}/toggle-ban`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const result = await res.json();
        showToast(result.isBanned ? 'Đã khóa tài khoản thành công' : 'Đã mở khóa tài khoản');
        // Update local state
        setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, isBanned: result.isBanned } : u)));
        if (userDetail && userDetail.user.uid === uid && userDetail.profile) {
          setUserDetail({
            ...userDetail,
            profile: { ...userDetail.profile, isBanned: result.isBanned },
          });
        }
        fetchOverview();
      }
    } catch {
      showToast('Thao tác khóa thất bại');
    }
  };

  // Quick Action: Toggle Verify
  const handleToggleVerify = async (uid: string, currentVerify: boolean) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/data-management/users/${uid}/toggle-verify`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const result = await res.json();
        showToast(result.isVerified ? 'Đã xác thực hồ sơ thành công' : 'Đã hủy xác thực hồ sơ');
        setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, isVerified: result.isVerified } : u)));
        if (userDetail && userDetail.user.uid === uid && userDetail.profile) {
          setUserDetail({
            ...userDetail,
            profile: { ...userDetail.profile, isVerified: result.isVerified },
          });
        }
        fetchOverview();
      }
    } catch {
      showToast('Thao tác xác thực thất bại');
    }
  };

  // Quick Action: Toggle VIP
  const handleToggleVip = async (uid: string, currentVip: boolean) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/data-management/users/${uid}/toggle-vip`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isVip: !currentVip }),
      });
      if (res.ok) {
        showToast(!currentVip ? 'Đã kích hoạt gói VIP' : 'Đã hủy gói VIP');
        setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, isPremium: !currentVip } : u)));
        if (userDetail && userDetail.user.uid === uid) {
          setUserDetail({
            ...userDetail,
            user: { ...userDetail.user, isPremium: !currentVip },
          });
        }
        fetchOverview();
      }
    } catch {
      showToast('Thao tác cập nhật VIP thất bại');
    }
  };

  // Copy UID helper
  const handleCopyUid = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Chưa có';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-neutral-950 text-neutral-100">
      {/* ------------------------------------------------------------------ */}
      {/* SECTION HEADER & DATABASE CONNECTION STATUS BAR                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Quản Lý Dữ Liệu
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-neutral-800 border border-neutral-700 text-neutral-300">
                  Cloud SQL PostgreSQL
                </span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cơ sở dữ liệu: <code className="text-rose-300 font-mono">cloud_sql_development_database</code> · Đồng bộ hóa theo thời gian thực
              </p>
            </div>
          </div>
        </div>

        {/* Live Diagnostics Badge & Action */}
        <div className="flex items-center gap-3">
          {health ? (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                health.status === 'CONNECTED'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>
                {health.status === 'CONNECTED' ? 'Đã kết nối PostgreSQL' : 'Mất kết nối Database'}
              </span>
              {health.status === 'CONNECTED' && (
                <span className="text-[10px] font-mono opacity-80 pl-1 border-l border-emerald-500/30">
                  {health.latencyMs}ms
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 animate-pulse">
              Đang kiểm tra kết nối...
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            title="Tải lại toàn bộ dữ liệu từ Cloud SQL PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
            <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION A: TỔNG QUAN DỮ LIỆU (OVERVIEW METRICS)                     */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            Tổng Quan Dữ Liệu Thực Tế Trong Database
          </h2>
          {metrics?.lastUpdated && (
            <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-neutral-400" />
              Cập nhật gần nhất: <span className="text-neutral-200">{formatDate(metrics.lastUpdated)}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Tổng số tài khoản */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all">
            <span className="text-[11px] font-medium text-neutral-400 block mb-1">
              Tổng số tài khoản
            </span>
            <div className="text-2xl font-black tracking-tight text-white font-mono tabular-nums">
              {metrics ? metrics.totalAccounts.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-neutral-400" />
              Bảng <code className="text-neutral-300 font-mono">users</code>
            </div>
          </div>

          {/* 2. Hồ sơ hoàn thiện */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/40 transition-all group">
            <span className="text-[11px] font-medium text-emerald-400/90 block mb-1">
              Hồ sơ hoàn thiện
            </span>
            <div className="text-2xl font-black tracking-tight text-emerald-300 font-mono tabular-nums">
              {metrics ? metrics.completedProfiles.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Có ảnh & tiểu sử
            </div>
          </div>

          {/* 3. Hồ sơ đang hoạt động */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-blue-500/40 transition-all">
            <span className="text-[11px] font-medium text-blue-400/90 block mb-1">
              Hồ sơ hoạt động
            </span>
            <div className="text-2xl font-black tracking-tight text-blue-300 font-mono tabular-nums">
              {metrics ? metrics.activeProfiles.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-400" />
              Không bị khóa
            </div>
          </div>

          {/* 4. Hồ sơ chưa hoàn thiện */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 transition-all">
            <span className="text-[11px] font-medium text-amber-400/90 block mb-1">
              Chưa hoàn thiện
            </span>
            <div className="text-2xl font-black tracking-tight text-amber-300 font-mono tabular-nums">
              {metrics ? metrics.incompleteProfiles.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Thiếu thông tin/ảnh
            </div>
          </div>

          {/* 5. Tài khoản VIP / Premium */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/40 transition-all">
            <span className="text-[11px] font-medium text-purple-400/90 block mb-1">
              Tài khoản VIP
            </span>
            <div className="text-2xl font-black tracking-tight text-purple-300 font-mono tabular-nums">
              {metrics ? metrics.premiumAccounts.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <Crown className="w-3 h-3 text-purple-400" />
              Gói Premium
            </div>
          </div>

          {/* 6. Tương tác hệ thống */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-rose-500/40 transition-all">
            <span className="text-[11px] font-medium text-rose-400/90 block mb-1">
              Tương hợp & Quẹt
            </span>
            <div className="text-2xl font-black tracking-tight text-rose-300 font-mono tabular-nums">
              {metrics ? metrics.totalMatches.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" />
              / {metrics?.totalSwipes?.toLocaleString() || 0} lượt quẹt
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION B: DANH SÁCH NGƯỜI DÙNG (DATA TABLE)                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        {/* Controls Bar: Search & Status Filters */}
        <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo UID, Tên hiển thị, Email..."
              className="w-full pl-9 pr-20 py-2 rounded-xl bg-neutral-950 border border-neutral-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs text-neutral-100 placeholder:text-neutral-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  fetchUsers(1, '', statusFilter);
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
              >
                Xóa
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold transition-colors"
            >
              Tìm
            </button>
          </form>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Hoạt động' },
              { id: 'COMPLETED', label: 'Đã hoàn thiện' },
              { id: 'INCOMPLETE', label: 'Chưa xong' },
              { id: 'VERIFIED', label: 'Đã xác thực' },
              { id: 'VIP', label: 'VIP' },
              { id: 'BANNED', label: 'Bị khóa' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => fetchUsers(pagination.page)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-4">Người Dùng / Hồ Sơ</th>
                  <th className="py-3 px-4">Mã UID (Định danh)</th>
                  <th className="py-3 px-4">Trạng Thái Hồ Sơ</th>
                  <th className="py-3 px-4">Ngày Tạo</th>
                  <th className="py-3 px-4">Cập Nhật</th>
                  <th className="py-3 px-4 text-right">Thao Tác Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {isLoading ? (
                  // Skeleton Loading State
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-800" />
                          <div className="space-y-1.5">
                            <div className="w-24 h-3 bg-neutral-800 rounded" />
                            <div className="w-36 h-2.5 bg-neutral-850 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4"><div className="w-28 h-3 bg-neutral-800 rounded font-mono" /></td>
                      <td className="py-3.5 px-4"><div className="w-20 h-5 bg-neutral-800 rounded-md" /></td>
                      <td className="py-3.5 px-4"><div className="w-24 h-3 bg-neutral-800 rounded" /></td>
                      <td className="py-3.5 px-4"><div className="w-24 h-3 bg-neutral-800 rounded" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="w-16 h-7 bg-neutral-800 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Database className="w-8 h-8 text-neutral-600" />
                        <span className="font-semibold text-neutral-300">Không tìm thấy người dùng phù hợp</span>
                        <span className="text-xs text-neutral-400">
                          Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.uid}
                      onClick={() => handleOpenDetail(u.uid)}
                      className="hover:bg-neutral-800/50 cursor-pointer transition-colors group"
                    >
                      {/* User Display & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.displayName}
                                className="w-10 h-10 rounded-xl object-cover ring-1 ring-neutral-700 bg-neutral-800"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center font-bold text-neutral-300 ring-1 ring-neutral-700">
                                {u.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {u.isVerified && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center ring-2 ring-neutral-900" title="Đã xác thực">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-neutral-100 truncate group-hover:text-rose-300 transition-colors">
                                {u.displayName}
                              </span>
                              {u.age && (
                                <span className="text-neutral-400 text-[11px]">
                                  {u.age}t
                                </span>
                              )}
                              {u.isPremium && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" />
                                  VIP
                                </span>
                              )}
                            </div>
                            <span className="text-neutral-400 text-[11px] block truncate font-mono">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* UID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300">
                            {u.uid.length > 16 ? `${u.uid.slice(0, 14)}...` : u.uid}
                          </code>
                          <button
                            type="button"
                            onClick={(e) => handleCopyUid(u.uid, e)}
                            className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                            title="Sao chép UID"
                          >
                            {copiedUid === u.uid ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Profile Status Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {u.isBanned ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                              Bị khóa
                            </span>
                          ) : !u.hasProfile ? (
                            <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 text-[10px] font-medium">
                              Chưa tạo hồ sơ
                            </span>
                          ) : u.isComplete ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                              Hoàn thiện ({u.photosCount} ảnh)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-medium">
                              Chưa hoàn thiện
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-mono">
                        {formatDate(u.userCreatedAt)}
                      </td>

                      {/* Updated At */}
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px] font-mono">
                        {formatDate(u.profileUpdatedAt || u.userUpdatedAt)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOpenDetail(u.uid)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            title="Xem chi tiết hồ sơ trong Database"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleVerify(u.uid, u.isVerified)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isVerified
                                ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-blue-300 hover:bg-neutral-700'
                            }`}
                            title={u.isVerified ? 'Hủy xác thực' : 'Xác thực hồ sơ'}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleVip(u.uid, u.isPremium)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isPremium
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-amber-300 hover:bg-neutral-700'
                            }`}
                            title={u.isPremium ? 'Hủy VIP' : 'Kích hoạt VIP'}
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleBan(u.uid, u.isBanned)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isBanned
                                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-rose-300 hover:bg-neutral-700'
                            }`}
                            title={u.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="py-3 px-4 border-t border-neutral-800 bg-neutral-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
            <div>
              Hiển thị <span className="font-semibold text-neutral-200">{users.length}</span> /{' '}
              <span className="font-semibold text-neutral-200">{pagination.total}</span> tài khoản từ{' '}
              <code className="text-neutral-300 font-mono">Cloud SQL PostgreSQL</code>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1 || isLoading}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-neutral-200 transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-neutral-200 transition-colors"
                  title="Trang kế tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION C: CHI TIẾT HỒ SƠ MODAL / DRAWER                           */}
      {/* ------------------------------------------------------------------ */}
      {selectedUid && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Chi Tiết Hồ Sơ Database
                    {userDetail?.profile?.isVerified && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        Đã xác thực
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono truncate max-w-xs sm:max-w-md">
                    UID: {selectedUid}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailTab(detailTab === 'profile' ? 'raw_json' : 'profile')}
                  className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  title="Chuyển chế độ xem JSON gốc từ PostgreSQL"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{detailTab === 'profile' ? 'JSON thô' : 'Hồ sơ UI'}</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedUid(null);
                    setUserDetail(null);
                  }}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {isLoadingDetail ? (
                <div className="py-16 text-center text-neutral-400 animate-pulse flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
                  <span>Đang tải thông tin bản ghi từ PostgreSQL...</span>
                </div>
              ) : !userDetail ? (
                <div className="py-12 text-center text-rose-400">
                  Không tìm thấy hồ sơ người dùng trong cơ sở dữ liệu.
                </div>
              ) : detailTab === 'raw_json' ? (
                /* Raw JSON Inspection Tab */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Bản ghi dữ liệu JSON đã lọc sạch (không chứa mật khẩu):</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(userDetail, null, 2));
                        showToast('Đã sao chép JSON người dùng');
                      }}
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[11px]"
                    >
                      Sao chép JSON
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                    {JSON.stringify(userDetail, null, 2)}
                  </pre>
                </div>
              ) : (
                /* Structured Profile View */
                <div className="space-y-6">
                  {/* Basic Card Header */}
                  <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                    <div className="shrink-0 flex justify-center">
                      {userDetail.profile?.photos?.[0] ? (
                        <img
                          src={userDetail.profile.photos[0]}
                          alt={userDetail.profile.displayName}
                          className="w-24 h-24 rounded-2xl object-cover ring-2 ring-rose-500/30"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-neutral-800 flex items-center justify-center text-2xl font-bold text-neutral-400">
                          {userDetail.profile?.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-white">
                          {userDetail.profile?.displayName || userDetail.user.email}
                        </h4>
                        {userDetail.profile?.age && (
                          <span className="text-sm font-semibold text-neutral-400">
                            · {userDetail.profile.age} tuổi ({userDetail.profile.gender})
                          </span>
                        )}
                        {userDetail.user.isPremium && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 font-mono">
                        Email: <span className="text-neutral-200">{userDetail.user.email}</span>
                      </p>
                      <p className="text-xs text-neutral-400">
                        Vị trí: <span className="text-neutral-200">{userDetail.profile?.locationName || 'Chưa cập nhật'}</span>
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-mono">
                          Tạo: {formatDate(userDetail.user.createdAt)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-mono">
                          Cập nhật: {formatDate(userDetail.profile?.updatedAt || userDetail.user.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                      <span className="text-[10px] text-neutral-400 block">Lượt quẹt đã gửi</span>
                      <span className="text-lg font-black text-rose-400 font-mono">
                        {userDetail.stats.swipesSent}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                      <span className="text-[10px] text-neutral-400 block">Lượt quẹt nhận</span>
                      <span className="text-lg font-black text-pink-400 font-mono">
                        {userDetail.stats.swipesReceived}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                      <span className="text-[10px] text-neutral-400 block">Tương hợp (Matches)</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        {userDetail.stats.matchesCount}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {userDetail.profile?.bio && (
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Giới thiệu bản thân (Bio)
                      </h5>
                      <p className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        {userDetail.profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Photo Gallery */}
                  {userDetail.profile?.photos && userDetail.profile.photos.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Album ảnh ({userDetail.profile.photos.length} ảnh)
                      </h5>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {userDetail.profile.photos.map((photoUrl, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 group relative"
                          >
                            <img
                              src={photoUrl}
                              alt={`Ảnh ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-mono">
                              #{idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {userDetail.profile?.interests && userDetail.profile.interests.length > 0 && (
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Sở thích
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {userDetail.profile.interests.map((interest, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career & Lifestyle Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1">
                      <span className="text-[10px] text-neutral-400 block">Nghề nghiệp / Công ty</span>
                      <span className="font-semibold text-neutral-200">
                        {userDetail.profile?.jobTitle || 'Chưa cập nhật'}
                        {userDetail.profile?.company ? ` @ ${userDetail.profile.company}` : ''}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-1">
                      <span className="text-[10px] text-neutral-400 block">Học vấn & Cung hoàng đạo</span>
                      <span className="font-semibold text-neutral-200">
                        {userDetail.profile?.education || 'Chưa cập nhật'} · {userDetail.profile?.zodiac || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                Bảo mật: Không bao gồm mật khẩu
              </span>
              <div className="flex items-center gap-2">
                {userDetail && (
                  <>
                    <button
                      onClick={() => handleToggleBan(userDetail.user.uid, userDetail.profile?.isBanned || false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        userDetail.profile?.isBanned
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {userDetail.profile?.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                    </button>
                    <button
                      onClick={() => handleToggleVerify(userDetail.user.uid, userDetail.profile?.isVerified || false)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      {userDetail.profile?.isVerified ? 'Hủy xác thực' : 'Xác thực hồ sơ'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedUid(null);
                    setUserDetail(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
