import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Share2,
  Copy,
  Check,
  QrCode,
  Terminal,
  FileCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useDating } from '../../context/DatingContext';

interface DownloadInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadInstallModal: React.FC<DownloadInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { currentProfile, matches, messages, showToast } = useDating();

  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'source'>('pwa');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://cupidgo.app';

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    showToast('Đã sao chép lệnh build APK');
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    showToast('Đã sao chép liên kết ứng dụng');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportData = () => {
    const backupData = {
      app: 'CupidGo Dating App',
      exportDate: new Date().toISOString(),
      profile: currentProfile,
      matchesCount: matches.length,
      matches,
      messages,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cupidgo-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Đã tải tệp sao lưu dữ liệu ứng dụng (.json)');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div 
        className="w-full max-w-md max-h-[92vh] bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">
                Tải Về & Cài Đặt Ứng Dụng
              </h2>
              <span className="text-[10px] text-neutral-400">CupidGo Mobile App</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-neutral-800 text-rose-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Cài lên điện thoại</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-neutral-800 text-rose-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Xuất file APK</span>
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'source'
                ? 'bg-neutral-800 text-rose-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Dữ liệu & Mã</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: PWA DIRECT INSTALL */}
          {activeTab === 'pwa' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-gradient-to-r from-rose-500/15 via-pink-500/15 to-purple-500/15 border border-rose-500/30 rounded-2xl">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Cài đặt ứng dụng trực tiếp không cần kho ứng dụng</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  CupidGo hỗ trợ công nghệ Web App tiên tiến (PWA), cho phép cài đặt trực tiếp lên màn hình chính điện thoại như ứng dụng gốc, hoạt động mượt mà và không tốn dung lượng.
                </p>
              </div>

              {/* Install status & action button */}
              {isInstalled ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4" />
                  <span>Ứng dụng CupidGo đã được cài đặt trên thiết bị của bạn!</span>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={install}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Cài đặt CupidGo ngay (1 chạm)
                </button>
              ) : null}

              {/* Instructions for iOS and Android */}
              <div className="space-y-3">
                {/* iOS Guide */}
                <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-200 mb-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px]">
                      
                    </span>
                    <span>Dành cho iPhone / iPad (Trình duyệt Safari):</span>
                  </div>
                  <ol className="text-xs text-neutral-400 space-y-1.5 list-decimal pl-5 leading-relaxed">
                    <li>
                      Mở liên kết ứng dụng bằng trình duyệt <strong>Safari</strong>.
                    </li>
                    <li>
                      Chạm vào nút <strong>Chia sẻ (Share)</strong> hình ô vuông có mũi tên ở thanh dưới cùng.
                    </li>
                    <li>
                      Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
                    </li>
                  </ol>
                </div>

                {/* Android Guide */}
                <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-200 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                      ▶
                    </span>
                    <span>Dành cho điện thoại Android (Chrome / Cốc Cốc):</span>
                  </div>
                  <ol className="text-xs text-neutral-400 space-y-1.5 list-decimal pl-5 leading-relaxed">
                    <li>
                      Chạm vào biểu tượng <strong>dấu 3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt.
                    </li>
                    <li>
                      Chọn <strong>"Cài đặt ứng dụng" (Install app)</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                    </li>
                    <li>Biểu tượng CupidGo sẽ xuất hiện ngay trên màn hình điện thoại!</li>
                  </ol>
                </div>

                {/* Share Link Box */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase block mb-1.5">
                    Liên kết mở trực tiếp trên điện thoại:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentUrl}
                      className="flex-1 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl text-xs text-neutral-300 select-all truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="shrink-0 p-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 rounded-xl transition-colors"
                      title="Sao chép liên kết"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT APK ANDROID */}
          {activeTab === 'apk' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                  Hướng dẫn build file APK Android (Theo Mục 7 PRD)
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Để đóng gói ứng dụng thành file <code className="text-neutral-200 font-mono">.apk</code> cài đặt độc lập lên điện thoại Android:
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-neutral-200 block">
                  Bước 1: Chạy lệnh xuất file APK
                </span>
                <p className="text-xs text-neutral-400">
                  Mở Terminal tại thư mục dự án và thực thi lệnh sau:
                </p>

                <div className="relative group">
                  <pre className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                    flutter build apk --release
                  </pre>
                  <button
                    onClick={() => handleCopyCommand('flutter build apk --release')}
                    className="absolute top-2 right-2 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                    title="Sao chép lệnh"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1.5">
                <span className="text-xs font-bold text-neutral-200 block">
                  Bước 2: Vị trí file APK xuất ra
                </span>
                <p className="text-xs text-neutral-400">
                  Sau khi build hoàn tất, file APK sẽ được tạo tại đường dẫn:
                </p>
                <div className="p-2.5 bg-neutral-900 border border-neutral-800/80 rounded-xl text-[11px] font-mono text-amber-300 select-all">
                  build/app/outputs/flutter-apk/app-release.apk
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-1.5">
                <span className="text-xs font-bold text-neutral-200 block">
                  Bước 3: Cài đặt lên điện thoại Android
                </span>
                <ul className="text-xs text-neutral-400 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Tải file <code className="text-neutral-300 font-mono">app-release.apk</code> lên Google Drive hoặc gửi qua Zalo/Telegram đến điện thoại.</li>
                  <li>Mở file trên điện thoại Android và nhấn <strong>Cài đặt (Install)</strong>.</li>
                  <li>Nếu máy hỏi cho phép cài đặt ứng dụng từ nguồn không xác định, nhấn <strong>Cho phép</strong>.</li>
                </ul>
              </div>

              {/* iOS Step Note */}
              <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-xs text-neutral-400">
                <strong className="text-neutral-200 block mb-0.5">Với iPhone (iOS):</strong>
                Kết nối iPhone với máy Mac qua cáp USB và chạy lệnh: <code className="text-emerald-400 font-mono">flutter run --release</code>
              </div>
            </div>
          )}

          {/* TAB 3: SOURCE & BACKUP */}
          {activeTab === 'source' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Sao lưu dữ liệu & Xuất mã nguồn
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Bạn có thể xuất toàn bộ dữ liệu tài khoản, hồ sơ cá nhân, danh sách tương hợp và tin nhắn về máy tính dưới dạng file JSON chuẩn hóa.
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Hồ sơ người dùng:</span>
                  <span className="font-semibold text-white">{currentProfile?.displayName || 'Tài khoản hiện tại'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Số lượng tương hợp (Matches):</span>
                  <span className="font-semibold text-rose-400">{matches.length} người</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Bộ nhớ lưu trữ:</span>
                  <span className="font-semibold text-emerald-400">Trình duyệt (Local State)</span>
                </div>

                <button
                  onClick={handleExportData}
                  className="w-full mt-2 py-3 px-4 bg-neutral-800 hover:bg-neutral-750 text-white font-semibold text-xs rounded-xl border border-neutral-700 transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4 text-rose-400" />
                  Tải tệp sao lưu dữ liệu (.json)
                </button>
              </div>

              <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-neutral-200 block">
                  Đóng gói mã nguồn dự án:
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Để build phiên bản Production của ứng dụng web:
                </p>
                <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-xs text-emerald-400">
                  npm run build
                </div>
                <p className="text-[11px] text-neutral-500">
                  Thư mục xuất ra: <code className="text-neutral-400 font-mono">dist/</code> (sẵn sàng deploy lên Cloud Run, Vercel, Firebase Hosting hoặc Capacitor).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CupidGo Mobile · An toàn 100%</span>
          </div>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
