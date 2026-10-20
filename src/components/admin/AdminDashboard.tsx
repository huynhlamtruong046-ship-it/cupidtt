import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  HeartHandshake,
  Settings,
  Smartphone,
  Search,
  Plus,
  ShieldCheck,
  ShieldX,
  Crown,
  Eye,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  Flame,
  ArrowUpRight,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  Database,
} from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { Profile, Gender } from '../../types';
import { AddUserModal } from './AddUserModal';
import { CardDetailSheet } from '../discovery/CardDetailSheet';
import { DataManagement } from './DataManagement';
import { CupidLogo } from '../common/CupidLogo';

export const AdminDashboard: React.FC = () => {
  const {
    setIsAdminMode,
    allManagedProfiles,
    toggleVerifyUser,
    toggleBanUser,
    reportsList,
    resolveReport,
    addNewProfile,
    updateUserVipStatus,
    adminStats,
    matches,
    messages,
    resetAllData,
    showToast,
  } = useDating();

  const [currentTab, setCurrentTab] = useState<'data-management' | 'overview' | 'users' | 'moderation' | 'matches' | 'settings'>('data-management');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | Gender>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'VIP' | 'BANNED'>('ALL');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<Profile | null>(null);
  const [selectedAuditMatch, setSelectedAuditMatch] = useState<string | null>(null);

  // Filtered users list
  const filteredUsers = allManagedProfiles.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.jobTitle && user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (genderFilter !== 'ALL' && user.gender !== genderFilter) return false;
    if (statusFilter === 'VERIFIED' && !user.isVerified) return false;
    if (statusFilter === 'BANNED' && !user.isBanned) return false;
    if (statusFilter === 'VIP' && !user.hasLikedCurrentUser) return false; // mock VIP criteria

    return true;
  });

  const handleExportJSON = () => {
    const data = {
      exportTime: new Date().toISOString(),
      stats: adminStats,
      usersCount: allManagedProfiles.length,
      users: allManagedProfiles,
      reports: reportsList,
      matches: matches,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cupidgo-admin-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất báo cáo cơ sở dữ liệu hệ thống (.json)');
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Bar Contract: 3 zones */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        {/* Zone 1: Breadcrumb Trail & Brand */}
        <div className="flex items-center gap-3">
          <CupidLogo size="sm" showWordmark={true} />
          <span className="text-neutral-600 hidden sm:inline">/</span>
          <span className="text-xs font-semibold text-neutral-400 hidden sm:inline">
            Quản trị hệ thống
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Server Online
          </span>
        </div>

        {/* Zone 2: Navigation Links (Compact in top bar or sidebar) */}
        <div className="hidden lg:flex items-center gap-1 text-xs">
          <span className="text-neutral-500 mr-2">Phiên bản Admin v1.2</span>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAdminMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            title="Quay lại giao diện ứng dụng hẹn hò di động"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mở App Hẹn Hò</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-56 shrink-0 border-r border-neutral-800 bg-neutral-900/60 p-3 hidden md:flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Phân hệ quản trị
            </div>

            <button
              onClick={() => setCurrentTab('data-management')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'data-management'
                  ? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-semibold text-neutral-100">Quản lý dữ liệu</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                SQL
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'overview'
                  ? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Tổng quan hệ thống</span>
            </button>

            <button
              onClick={() => setCurrentTab('users')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'users'
                  ? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>Quản lý người dùng</span>
              </div>
              <span className="text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                {allManagedProfiles.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('moderation')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'moderation'
                  ? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Kiểm duyệt & Báo cáo</span>
              </div>
              {adminStats.pendingReports > 0 && (
                <span className="text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                  {adminStats.pendingReports}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('matches')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'matches'
                  ? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span>Ghép đôi & Tin nhắn</span>
              </div>
              <span className="text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                {matches.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentTab === 'settings'
                  ? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Cấu hình & Bảng giá</span>
            </button>
          </div>

          {/* Bottom Sidebar Action */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
              Thao tác nhanh
            </span>
            <button
              onClick={handleExportJSON}
              className="w-full py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất dữ liệu (.json)</span>
            </button>
            <button
              onClick={resetAllData}
              className="w-full py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className={`flex-1 overflow-y-auto ${currentTab === 'data-management' ? 'p-0' : 'p-4 sm:p-6'} bg-neutral-950 flex flex-col`}>
          {/* Mobile Tab Pills for Narrow screens */}
          <div className="flex md:hidden gap-1.5 overflow-x-auto p-3 border-b border-neutral-800 bg-neutral-900/40 shrink-0">
            {[
              { id: 'data-management', label: 'Quản lý dữ liệu' },
              { id: 'overview', label: 'Tổng quan' },
              { id: 'users', label: 'Người dùng' },
              { id: 'moderation', label: `Báo cáo (${adminStats.pendingReports})` },
              { id: 'matches', label: 'Ghép đôi' },
              { id: 'settings', label: 'Cấu hình' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setCurrentTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  currentTab === t.id
                    ? 'bg-rose-500 text-white'
                    : 'bg-neutral-900 text-neutral-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 0: DATA MANAGEMENT (DIRECT CLOUD SQL POSTGRESQL) */}
          {currentTab === 'data-management' && <DataManagement />}

          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div>
                <h1 className="text-xl font-bold text-neutral-100">Bảng Điều Khiển Tổng Quan</h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Theo dõi số liệu người dùng, tương tác ghép đôi và doanh thu dịch vụ trong thời gian thực.
                </p>
              </div>

              {/* Stat Cards Grid (Tabular numerals, clean hierarchy) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Users */}
                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs font-medium">Tổng người dùng</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-neutral-100 font-mono tabular-nums">
                    {adminStats.totalUsers}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+14.2% so với tuần trước</span>
                  </div>
                </div>

                {/* VIP Users & Revenue */}
                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs font-medium">Thành viên VIP</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
                    {adminStats.premiumUsers}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-2">
                    Doanh thu:{' '}
                    <span className="font-mono tabular-nums font-bold text-neutral-200">
                      {adminStats.estimatedRevenue.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Total Swipes */}
                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs font-medium">Lượt quẹt thẻ</span>
                    <Flame className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-neutral-100 font-mono tabular-nums">
                    {adminStats.totalSwipes}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-2">
                    Tỷ lệ thích (Like rate): <span className="text-rose-400 font-semibold font-mono">64.8%</span>
                  </div>
                </div>

                {/* Successful Matches */}
                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs font-medium">Cặp đôi kết nối</span>
                    <HeartHandshake className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-pink-400 font-mono tabular-nums">
                    {adminStats.totalMatches}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-2">
                    Tỷ lệ tương hợp đạt 89.4%
                  </div>
                </div>
              </div>

              {/* Grid 2 Columns: Activity Log & Moderation Quick View */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activities */}
                <div className="lg:col-span-2 p-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-400" />
                      <span>Nhật Ký Tương Tác Trực Tuyến</span>
                    </h2>
                    <span className="text-[11px] text-neutral-500 font-mono">Tự động làm mới</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        action: 'Match thành công!',
                        detail: 'Đăng Khoa và Thảo Linh vừa ghép đôi lúc 19:35',
                        time: '5 phút trước',
                        type: 'match',
                      },
                      {
                        action: 'Gói VIP 3 tháng',
                        detail: 'Tài khoản Đăng Khoa kích hoạt gói CupidGo VIP qua MoMo',
                        time: '18 phút trước',
                        type: 'vip',
                      },
                      {
                        action: 'Báo cáo vi phạm mới',
                        detail: 'Phương Vy báo cáo hồ sơ nghi vấn dùng ảnh giả mạo',
                        time: '42 phút trước',
                        type: 'report',
                      },
                      {
                        action: 'Hồ sơ mới tham gia',
                        detail: 'Hoàng Nam hoàn tất quy trình Onboarding tại TP.HCM',
                        time: '1 giờ trước',
                        type: 'user',
                      },
                      {
                        action: 'Kích hoạt Tăng Tốc (Boost)',
                        detail: 'Hồ sơ Thảo Linh đứng đầu khu vực Cầu Giấy trong 30 phút',
                        time: '2 giờ trước',
                        type: 'boost',
                      },
                    ].map((act, i) => (
                      <div
                        key={i}
                        className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              act.type === 'match'
                                ? 'bg-pink-500'
                                : act.type === 'vip'
                                ? 'bg-amber-400'
                                : act.type === 'report'
                                ? 'bg-rose-500'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <div>
                            <span className="font-semibold text-neutral-200">{act.action}</span>
                            <span className="text-neutral-400 ml-2">{act.detail}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">
                          {act.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Moderation Alert Card */}
                <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span>Báo Cáo Cần Xử Lý</span>
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold font-mono">
                        {adminStats.pendingReports} mới
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                      Có {adminStats.pendingReports} báo cáo vi phạm từ người dùng đang chờ quản trị viên xem xét và xử lý để bảo đảm an toàn cộng đồng.
                    </p>

                    <div className="space-y-2 mb-4">
                      {reportsList.slice(0, 2).map((rep) => (
                        <div key={rep.id} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-neutral-200">{rep.targetProfile.displayName}</span>
                            <span className="text-[10px] text-rose-400 font-medium">Chờ duyệt</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 line-clamp-1">{rep.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentTab('moderation')}
                    className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Mở màn hình kiểm duyệt</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {currentTab === 'users' && (
            <div className="space-y-4">
              {/* Header Title & Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-neutral-100">Quản Lý Người Dùng & Hồ Sơ</h1>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Quản lý danh sách thành viên, cấp huy hiệu xác thực, phân quyền VIP và kiểm soát tài khoản.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm hồ sơ ứng viên</span>
                </button>
              </div>

              {/* Search and Filters Bar */}
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                {/* Search box */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên, nghề nghiệp, khu vực..."
                    className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Gender filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value as any)}
                    className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-rose-500"
                  >
                    <option value="ALL">Tất cả giới tính</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="MALE">Nam</option>
                    <option value="OTHER">Khác</option>
                  </select>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-rose-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="VERIFIED">Đã xác thực tích xanh</option>
                    <option value="VIP">Thành viên VIP</option>
                    <option value="BANNED">Đã bị khóa</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Người dùng</th>
                        <th className="py-3 px-3">Giới tính</th>
                        <th className="py-3 px-3">Khu vực</th>
                        <th className="py-3 px-3">Xác thực</th>
                        <th className="py-3 px-3">Gói VIP</th>
                        <th className="py-3 px-3">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 font-medium">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-neutral-500">
                            Không tìm thấy hồ sơ phù hợp với tiêu chí lọc
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.userId} className="hover:bg-neutral-850/50 transition-colors">
                            {/* User Avatar + Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.photos[0] || '/src/assets/images/cupid_linh_portrait_1791186047763.jpg'}
                                  alt={user.displayName}
                                  className="w-10 h-10 rounded-full object-cover border border-neutral-700 bg-neutral-800 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="font-bold text-neutral-100 flex items-center gap-1.5">
                                    <span>{user.displayName}</span>
                                    <span className="text-neutral-400 font-normal font-mono tabular-nums">
                                      {user.age}t
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-neutral-400 truncate max-w-[140px] block">
                                    {user.jobTitle || 'Người dùng mới'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Gender */}
                            <td className="py-3 px-3 text-neutral-300">
                              {user.gender === 'FEMALE' ? 'Nữ' : user.gender === 'MALE' ? 'Nam' : 'Khác'}
                            </td>

                            {/* Location */}
                            <td className="py-3 px-3 text-neutral-300 truncate max-w-[120px]">
                              {user.locationName}
                            </td>

                            {/* Verified Badge */}
                            <td className="py-3 px-3">
                              <button
                                onClick={() => toggleVerifyUser(user.userId)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  user.isVerified
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                    : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                                }`}
                                title="Bấm để bật/tắt xác thực"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>{user.isVerified ? 'Tích xanh' : 'Chưa'}</span>
                              </button>
                            </td>

                            {/* VIP Status */}
                            <td className="py-3 px-3">
                              <button
                                onClick={() => updateUserVipStatus(user.userId, !user.hasLikedCurrentUser)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  user.hasLikedCurrentUser
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : 'bg-neutral-800 text-neutral-400 hover:text-amber-300'
                                }`}
                                title="Bấm để cấp/hủy VIP"
                              >
                                <Crown className="w-3 h-3" />
                                <span>{user.hasLikedCurrentUser ? 'VIP Gold' : 'Free'}</span>
                              </button>
                            </td>

                            {/* Account Status */}
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  user.isBanned
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {user.isBanned ? 'Bị khóa' : 'Hoạt động'}
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setPreviewProfile(user)}
                                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                                  title="Xem trước hồ sơ"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => toggleBanUser(user.userId)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    user.isBanned
                                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                  }`}
                                  title={user.isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản vi phạm'}
                                >
                                  {user.isBanned ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldX className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MODERATION & REPORTS */}
          {currentTab === 'moderation' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-neutral-100">Kiểm Duyệt & Xử Lý Báo Cáo Vi Phạm</h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Xử lý khiếu nại về hành vi quấy rối, giả mạo tài khoản và giữ an toàn môi trường hẹn hò.
                </p>
              </div>

              <div className="space-y-3">
                {reportsList.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 text-xs">
                    Hiện tại không có báo cáo vi phạm nào
                  </div>
                ) : (
                  reportsList.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Report Details */}
                      <div className="flex items-start gap-3">
                        <img
                          src={report.targetProfile.photos[0] || '/src/assets/images/cupid_linh_portrait_1791186047763.jpg'}
                          alt={report.targetProfile.displayName}
                          className="w-12 h-12 rounded-full object-cover border border-neutral-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-neutral-100">
                              Đối tượng: {report.targetProfile.displayName} ({report.targetProfile.age}t)
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                report.status === 'PENDING'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : report.status === 'RESOLVED'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {report.status === 'PENDING'
                                ? 'Chờ kiểm duyệt'
                                : report.status === 'RESOLVED'
                                ? 'Đã xử lý khóa'
                                : 'Đã bác bỏ'}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-300">
                            <strong>Lý do khiếu nại:</strong> {report.reason}
                          </p>

                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                            <span>Người báo cáo: {report.reporterName}</span>
                            <span>·</span>
                            <span>{report.createdAt}</span>
                            {report.actionTaken && (
                              <>
                                <span>·</span>
                                <span className="text-neutral-400">{report.actionTaken}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      {report.status === 'PENDING' ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => resolveReport(report.id, 'DISMISS')}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors"
                          >
                            Bác bỏ khiếu nại
                          </button>
                          <button
                            onClick={() => resolveReport(report.id, 'BAN')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                          >
                            Khóa tài khoản vi phạm
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-500 italic shrink-0">
                          Hồ sơ đã được xử lý xong
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MATCHES & CHATS OVERSIGHT */}
          {currentTab === 'matches' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-neutral-100">Giám Sát Tương Hợp & Hội Thoại</h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Kiểm tra các cặp đôi ghép đôi thành công và lịch sử trao đổi để đảm bảo an toàn.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.length === 0 ? (
                  <div className="col-span-2 p-8 text-center bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 text-xs">
                    Chưa có cặp đôi nào ghép đôi trên hệ thống
                  </div>
                ) : (
                  matches.map((m) => {
                    const matchMessages = messages[m.id] || [];
                    return (
                      <div
                        key={m.id}
                        className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={m.partnerProfile.photos[0]}
                                alt={m.partnerProfile.displayName}
                                className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-neutral-900" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-neutral-100">
                                Đăng Khoa & {m.partnerProfile.displayName}
                              </div>
                              <span className="text-[10px] text-neutral-400">
                                Match lúc: {m.lastMessageTime || 'Hôm nay'}
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/30 text-[10px] font-bold font-mono">
                            {matchMessages.length} tin nhắn
                          </span>
                        </div>

                        {/* Last Message Preview */}
                        <div className="p-2.5 bg-neutral-950 rounded-xl text-xs text-neutral-300 line-clamp-1 border border-neutral-850">
                          {m.lastMessage || 'Chưa có tin nhắn nào được gửi'}
                        </div>

                        {/* Audit Details Button */}
                        <button
                          onClick={() => {
                            setSelectedAuditMatch(selectedAuditMatch === m.id ? null : m.id);
                          }}
                          className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{selectedAuditMatch === m.id ? 'Ẩn lịch sử chat' : 'Xem nhật ký chat'}</span>
                        </button>

                        {/* Chat Log Drawer */}
                        {selectedAuditMatch === m.id && (
                          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 max-h-48 overflow-y-auto">
                            {matchMessages.length === 0 ? (
                              <div className="text-[11px] text-neutral-500 text-center py-2">Chưa có tin nhắn</div>
                            ) : (
                              matchMessages.map((msg) => (
                                <div key={msg.id} className="text-xs space-y-0.5">
                                  <div className="text-[10px] text-neutral-500 font-mono">
                                    {msg.senderId === m.partnerProfile.userId ? m.partnerProfile.displayName : 'Đăng Khoa'} · {msg.sentAt}
                                  </div>
                                  <div className="p-2 bg-neutral-900 rounded-lg text-neutral-200">
                                    {msg.content}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM & PRICING SETTINGS */}
          {currentTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-xl font-bold text-neutral-100">Cấu Hình Dịch Vụ & Bảng Giá VIP</h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Thiết lập giá cước gói Freemium, tham số thuật toán ghép đôi và lưu trữ hệ thống.
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-4">
                <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>Bảng Giá Gói Dịch Vụ CupidGo VIP</span>
                </h2>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <span className="text-neutral-400 block mb-1">Gói 1 Tháng</span>
                    <input
                      type="text"
                      defaultValue="149.000 đ"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 font-bold"
                    />
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <span className="text-neutral-400 block mb-1">Gói 3 Tháng (Phổ biến)</span>
                    <input
                      type="text"
                      defaultValue="299.000 đ"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 font-bold"
                    />
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <span className="text-neutral-400 block mb-1">Gói 6 Tháng</span>
                    <input
                      type="text"
                      defaultValue="499.000 đ"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 font-bold"
                    />
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <span className="text-neutral-400 block mb-1">Gói 12 Tháng</span>
                    <input
                      type="text"
                      defaultValue="799.000 đ"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={() => showToast('Đã lưu cấu hình bảng giá mới thành công')}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Cập nhật bảng giá
                </button>
              </div>

              {/* Algorithm parameters */}
              <div className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-2xl space-y-4">
                <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>Tham Số Thuật Toán Đề Xuất (Matching Algorithm)</span>
                </h2>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-neutral-300 block mb-1 font-medium">
                      Bán kính quét khoảng cách mặc định (km)
                    </label>
                    <input
                      type="number"
                      defaultValue={35}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1 font-medium">
                      Giới hạn lượt quẹt mỗi ngày cho tài khoản Thường (Free)
                    </label>
                    <input
                      type="number"
                      defaultValue={50}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100"
                    />
                  </div>
                </div>

                <button
                  onClick={() => showToast('Đã lưu cấu hình thuật toán')}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl transition-colors"
                >
                  Lưu thiết lập thuật toán
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAdd={addNewProfile}
      />

      {/* Profile Detail Preview Sheet */}
      {previewProfile && (
        <CardDetailSheet
          profile={previewProfile}
          onClose={() => setPreviewProfile(null)}
        />
      )}
    </div>
  );
};
