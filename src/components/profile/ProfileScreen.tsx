import React, { useState } from 'react';
import {
  Edit3,
  Settings,
  Crown,
  Zap,
  Star,
  Shield,
  LogOut,
  ChevronRight,
  Eye,
  Sliders,
  HelpCircle,
  Lock,
  Heart,
  RefreshCw,
  Download,
  Smartphone,
  LayoutDashboard,
  Database,
  MapPin,
  Calendar,
  Sparkles,
  Check,
  Mail,
  User,
} from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { CardDetailSheet } from '../discovery/CardDetailSheet';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    currentProfile,
    setIsEditProfileModalOpen,
    setIsPremiumModalOpen,
    setIsFilterModalOpen,
    setIsDownloadModalOpen,
    setIsAdminMode,
    activateBoost,
    isBoostActive,
    logout,
    resetAllData,
    showToast,
  } = useDating();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  if (!currentProfile) return null;

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-neutral-100 overflow-y-auto">
      {/* Section Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Hồ Sơ Của Tôi & Cài Đặt
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Quản lý thông tin cá nhân hiển thị, quyền lợi thành viên và cấu hình kết nối.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa hồ sơ</span>
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium border border-neutral-700 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem trước</span>
          </button>
        </div>
      </div>

      {/* Multi-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ============================================================== */}
        {/* LEFT COLUMN: PERSONAL PROFILE CARD & BASIC DETAILS (Col 1-5)   */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main User Card */}
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-5">
            {/* Avatar & Badges */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-neutral-700 bg-neutral-800 shadow-xl">
                  <img
                    src={currentProfile.photos[0]}
                    alt={currentProfile.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {currentUser?.isPremium && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 border-2 border-neutral-900 flex items-center justify-center shadow">
                    <Crown className="w-4 h-4 text-neutral-950 fill-neutral-950" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-white">
                    {currentProfile.displayName}
                  </h2>
                  <span className="text-2xl font-light text-neutral-400">
                    {currentProfile.age}
                  </span>
                  {currentProfile.isVerified && (
                    <span className="p-0.5 rounded-full bg-blue-500 text-white" title="Đã xác thực">
                      <Shield className="w-3.5 h-3.5 fill-white stroke-none" />
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-neutral-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{currentProfile.locationName}</span>
                </div>

                {currentProfile.jobTitle && (
                  <p className="text-xs text-neutral-300 mt-1 truncate">
                    {currentProfile.jobTitle}
                    {currentProfile.company ? ` @ ${currentProfile.company}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Account Metadata Box */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Tài khoản email:</span>
                <span className="text-neutral-200 font-mono text-[11px] truncate max-w-[200px]">
                  {currentUser?.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Mã người dùng (UID):</span>
                <code className="text-rose-300 font-mono text-[11px] truncate max-w-[180px]">
                  {currentProfile.userId || currentUser?.id}
                </code>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Gói thành viên:</span>
                <span className="font-semibold text-neutral-200">
                  {currentUser?.isPremium ? 'VIP Premium' : 'Gói Tiêu Chuẩn (Miễn phí)'}
                </span>
              </div>
            </div>

            {/* Bio Preview */}
            {currentProfile.bio && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Tiểu sử của bạn
                </span>
                <p className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {currentProfile.bio}
                </p>
              </div>
            )}

            {/* Interests Chips */}
            {currentProfile.interests && currentProfile.interests.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  Sở thích đã chọn ({currentProfile.interests.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentProfile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: VIP ADDONS & SETTINGS PREFERENCES (Col 6-12)     */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Feature Add-on Cards Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-1">
              Đặc quyền & Tính năng tăng cường
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* VIP Gold Card */}
              <button
                onClick={() => setIsPremiumModalOpen(true)}
                className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 text-left hover:border-amber-500/70 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Crown className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase">
                    {currentUser?.isPremium ? 'Đang bật' : 'Nâng cấp'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-amber-300 transition-colors">
                    CupidGo VIP
                  </span>
                  <span className="text-xs text-neutral-400 mt-0.5 block leading-relaxed">
                    Xem ai thích bạn, quẹt không giới hạn và đổi vị trí
                  </span>
                </div>
              </button>

              {/* Super Likes Card */}
              <button
                onClick={() => {
                  if (currentUser?.isPremium) {
                    showToast('Bạn có Super Like không giới hạn với gói VIP!');
                  } else {
                    setIsPremiumModalOpen(true);
                  }
                }}
                className="p-4 rounded-2xl bg-neutral-900 border border-blue-500/30 text-left hover:border-blue-500/70 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Star className="w-5 h-5 fill-blue-400/20" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                    {currentUser?.isPremium ? 'Vô hạn' : `${currentUser?.superLikesRemaining || 0} lượt`}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-blue-300 transition-colors">
                    Siêu Thích
                  </span>
                  <span className="text-xs text-neutral-400 mt-0.5 block leading-relaxed">
                    Nổi bật trực tiếp trên màn hình của đối phương
                  </span>
                </div>
              </button>

              {/* Boost Card */}
              <button
                onClick={activateBoost}
                className="p-4 rounded-2xl bg-neutral-900 border border-purple-500/30 text-left hover:border-purple-500/70 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Zap className={`w-5 h-5 ${isBoostActive ? 'fill-purple-400 animate-pulse' : ''}`} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                    {isBoostActive ? 'Đang chạy' : 'Sẵn sàng'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-purple-300 transition-colors">
                    Tăng Tốc
                  </span>
                  <span className="text-xs text-neutral-400 mt-0.5 block leading-relaxed">
                    Đứng đầu lượt tìm kiếm trong khu vực 30 phút
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Settings & Options List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
              Cài đặt & Tùy chọn hệ thống
            </h3>

            {/* Discovery Filter */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="w-full p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-100 block">
                    Phạm vi khám phá & Độ tuổi mong muốn
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Bán kính tối đa {currentProfile.maxDistancePref} km · Độ tuổi từ {currentProfile.minAgePref} đến {currentProfile.maxAgePref} tuổi
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Data Management & PostgreSQL Direct Access */}
            <button
              onClick={() => setIsAdminMode(true)}
              className="w-full p-4 bg-neutral-900 hover:bg-neutral-850 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl flex items-center justify-between transition-colors text-left group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:text-emerald-300">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                    Quản lý dữ liệu (Data Management)
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono rounded border border-emerald-500/30">
                      Cloud SQL PostgreSQL
                    </span>
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Truy xuất trực tiếp database, thống kê tài khoản, hồ sơ và kiểm duyệt
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
            </button>

            {/* Download App to Device */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="w-full p-4 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-transparent hover:from-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                    Tải về máy & Cài đặt ứng dụng
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded">
                      PWA
                    </span>
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Cài lên iPhone, iPad, Android, Mac, Windows hoặc tải mã nguồn
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Privacy & Safety */}
            <button
              onClick={() => setShowPrivacyNotice(true)}
              className="w-full p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-800 text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-200 block">
                    Quyền riêng tư & An toàn thông tin
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Bảo vệ vị trí GPS, quản lý danh sách chặn và an toàn người dùng
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Help & Support */}
            <button
              onClick={() => showToast('Hỗ trợ người dùng: support@cupidgo.vn')}
              className="w-full p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-800 text-neutral-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-200 block">
                    Trợ giúp & Hỗ trợ kỹ thuật
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Điều khoản dịch vụ, hướng dẫn ghép đôi & giải đáp thắc mắc
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Reset App Demo Data */}
            <button
              onClick={resetAllData}
              className="w-full p-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-800 text-amber-400">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-200 block">
                    Đặt lại dữ liệu mẫu ban đầu
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Khôi phục lại danh sách hồ sơ khám phá và lượt tương hợp gốc
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full p-4 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors text-left text-rose-400 hover:text-rose-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Đăng xuất tài khoản</span>
                  <span className="text-[11px] text-neutral-500">
                    Đăng xuất khỏi phiên làm việc hiện tại trên thiết bị
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-8 pb-4 text-xs text-neutral-500 border-t border-neutral-800/80 mt-8">
        CupidGo Web · Phiên bản chính thức · Đã kết nối Cloud SQL PostgreSQL
      </div>

      {/* Preview Sheet */}
      {isPreviewOpen && (
        <CardDetailSheet
          profile={currentProfile}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {/* Privacy modal */}
      {showPrivacyNotice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-100 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              Quyền riêng tư & Bảo mật
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              CupidGo cam kết bảo vệ dữ liệu cá nhân của bạn trên mọi nền tảng:
            </p>
            <ul className="text-xs text-neutral-400 space-y-2 mb-6 list-disc pl-4">
              <li>Vị trí GPS chỉ hiển thị theo dạng khoảng cách ước tính (km), tuyệt đối không lộ địa chỉ chính xác.</li>
              <li>Chỉ những người đã Match thành công mới có thể gửi tin nhắn trò chuyện với bạn.</li>
              <li>Bạn có thể Chặn hoặc Báo cáo bất kỳ người dùng nào ngay lập tức khi phát hiện hành vi không phù hợp.</li>
              <li>Dữ liệu hồ sơ được lưu trữ an toàn trong Cloud SQL PostgreSQL.</li>
            </ul>
            <button
              onClick={() => setShowPrivacyNotice(false)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
