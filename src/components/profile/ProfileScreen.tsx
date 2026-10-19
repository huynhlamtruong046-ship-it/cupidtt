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
    <div className="flex-1 flex flex-col p-4 bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* Profile Card Summary */}
      <div className="relative mb-5 p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl text-center">
        {/* Avatar with Ring */}
        <div className="relative inline-block mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800 mx-auto shadow-lg">
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

        {/* Display name & Age */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h2 className="text-xl font-bold text-neutral-100">
            {currentProfile.displayName}
          </h2>
          <span className="text-xl font-light text-neutral-400">
            {currentProfile.age}
          </span>
          {currentProfile.isVerified && (
            <span className="p-0.5 rounded-full bg-blue-500 text-white" title="Đã xác thực">
              <Shield className="w-3.5 h-3.5 fill-white stroke-none" />
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-400 max-w-xs mx-auto line-clamp-1">
          {currentProfile.jobTitle ? `${currentProfile.jobTitle} · ` : ''}
          {currentProfile.locationName}
        </p>

        {/* Edit & Preview Button Group */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setIsEditProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold border border-neutral-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Chỉnh sửa hồ sơ
          </button>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-xl text-xs font-medium border border-neutral-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Xem trước
          </button>
        </div>
      </div>

      {/* VIP & Add-on Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {/* Premium */}
        <button
          onClick={() => setIsPremiumModalOpen(true)}
          className="p-3 rounded-2xl bg-neutral-900 border border-amber-500/30 text-left hover:border-amber-500/60 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase">
              {currentUser?.isPremium ? 'Đang bật' : 'Nâng cấp'}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-100 block">CupidGo VIP</span>
            <span className="text-[10px] text-neutral-400">Xem ai thích & quẹt thả ga</span>
          </div>
        </button>

        {/* Super Likes */}
        <button
          onClick={() => {
            if (currentUser?.isPremium) {
              showToast('Bạn có Super Like không giới hạn với gói VIP!');
            } else {
              setIsPremiumModalOpen(true);
            }
          }}
          className="p-3 rounded-2xl bg-neutral-900 border border-blue-500/30 text-left hover:border-blue-500/60 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 text-blue-400 fill-blue-400/20" />
            <span className="text-[10px] font-bold text-blue-400">
              {currentUser?.isPremium ? 'Vô hạn' : `${currentUser?.superLikesRemaining || 0} lượt`}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-100 block">Siêu Thích</span>
            <span className="text-[10px] text-neutral-400">Tăng 3x tỷ lệ ghép đôi</span>
          </div>
        </button>

        {/* Boost */}
        <button
          onClick={activateBoost}
          className="p-3 rounded-2xl bg-neutral-900 border border-purple-500/30 text-left hover:border-purple-500/60 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <Zap className={`w-5 h-5 ${isBoostActive ? 'text-purple-400 fill-purple-400 animate-pulse' : 'text-purple-400'}`} />
            <span className="text-[10px] font-bold text-purple-400">
              {isBoostActive ? 'Đang chạy' : 'Sẵn sàng'}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-100 block">Tăng Tốc</span>
            <span className="text-[10px] text-neutral-400">Đứng top khu vực 30 phút</span>
          </div>
        </button>
      </div>

      {/* Settings & Management List */}
      <div className="space-y-2 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1 mb-1">
          Cài đặt & Tùy chọn
        </h3>

        {/* Discovery Filter */}
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="w-full p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-neutral-400" />
            <div className="text-left">
              <span className="text-xs font-semibold text-neutral-200 block">
                Phạm vi khám phá & Độ tuổi
              </span>
              <span className="text-[10px] text-neutral-400">
                Bán kính {currentProfile.maxDistancePref} km · Độ tuổi {currentProfile.minAgePref} - {currentProfile.maxAgePref}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </button>

        {/* Download App to Device */}
        <button
          onClick={() => setIsDownloadModalOpen(true)}
          className="w-full p-3.5 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-transparent hover:from-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-rose-500" />
            <div className="text-left">
              <span className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                Tải về máy & Cài đặt ứng dụng
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded">HOT</span>
              </span>
              <span className="text-[10px] text-neutral-400">
                Cài lên iPhone, Android, xuất file APK hoặc tải mã nguồn
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        {/* Admin Portal Entry */}
        <button
          onClick={() => setIsAdminMode(true)}
          className="w-full p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 rounded-2xl flex items-center justify-between transition-colors group"
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-4 h-4 text-rose-400 group-hover:text-rose-300" />
            <div className="text-left">
              <span className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                Cổng Quản Trị Hệ Thống (Admin)
                <span className="px-1.5 py-0.2 bg-neutral-800 text-neutral-300 text-[9px] font-mono rounded">HQ</span>
              </span>
              <span className="text-[10px] text-neutral-400">
                Quản lý người dùng, duyệt vi phạm, giám sát ghép đôi
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        {/* Privacy & Safety */}
        <button
          onClick={() => setShowPrivacyNotice(true)}
          className="w-full p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-neutral-400" />
            <div className="text-left">
              <span className="text-xs font-semibold text-neutral-200 block">
                Quyền riêng tư & An toàn
              </span>
              <span className="text-[10px] text-neutral-400">
                Ẩn hồ sơ, quản lý danh sách chặn và bảo mật
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </button>

        {/* Help & Support */}
        <button
          onClick={() => showToast('Trung tâm trợ giúp CupidGo: support@cupidgo.vn')}
          className="w-full p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-neutral-400" />
            <div className="text-left">
              <span className="text-xs font-semibold text-neutral-200 block">
                Trợ giúp & Hỗ trợ
              </span>
              <span className="text-[10px] text-neutral-400">
                Điều khoản dịch vụ & Chính sách bảo mật
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </button>

        {/* Reset App Demo Data */}
        <button
          onClick={resetAllData}
          className="w-full p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-xs font-semibold text-neutral-200 block">
                Đặt lại dữ liệu mẫu
              </span>
              <span className="text-[10px] text-neutral-400">
                Khôi phục lại danh sách hồ sơ, lượt quẹt và tin nhắn ban đầu
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full p-3.5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between transition-colors text-rose-400 hover:text-rose-300"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-semibold">Đăng xuất tài khoản</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>
      </div>

      {/* Version note */}
      <div className="text-center py-4 text-[10px] text-neutral-500">
        CupidGo v1.0.0 · Phiên bản di động chính thức
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-100 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              Quyền riêng tư & Bảo mật
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              CupidGo cam kết bảo vệ dữ liệu cá nhân của bạn:
            </p>
            <ul className="text-xs text-neutral-400 space-y-2 mb-5 list-disc pl-4">
              <li>Vị trí GPS chỉ hiển thị theo dạng khoảng cách ước tính (km), không lộ địa chỉ cụ thể.</li>
              <li>Chỉ những người đã Match mới có thể gửi tin nhắn cho bạn.</li>
              <li>Bạn có thể Chặn hoặc Báo cáo bất kỳ người dùng nào ngay lập tức trong hồ sơ hoặc khung chat.</li>
            </ul>
            <button
              onClick={() => setShowPrivacyNotice(false)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
