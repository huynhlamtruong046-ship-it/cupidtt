import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Sparkles,
  Zap,
  RotateCcw,
  Star,
  Eye,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { useDating } from '../../context/DatingContext';

export const PremiumModal: React.FC = () => {
  const { isPremiumModalOpen, setIsPremiumModalOpen, upgradePremium, showToast } = useDating();

  const [selectedTier, setSelectedTier] = useState<
    '1_month' | '3_months' | '6_months' | '12_months'
  >('3_months');

  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'vnpay' | 'card'>('momo');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isPremiumModalOpen) return null;

  const packages = [
    {
      id: '1_month' as const,
      name: '1 Tháng',
      price: '149.000 đ',
      perMonth: '149.000 đ/tháng',
      popular: false,
    },
    {
      id: '3_months' as const,
      name: '3 Tháng',
      price: '299.000 đ',
      perMonth: '99.000 đ/tháng',
      save: 'Tiết kiệm 33%',
      popular: true,
    },
    {
      id: '6_months' as const,
      name: '6 Tháng',
      price: '499.000 đ',
      perMonth: '83.000 đ/tháng',
      save: 'Tiết kiệm 45%',
      popular: false,
    },
    {
      id: '12_months' as const,
      name: '12 Tháng',
      price: '799.000 đ',
      perMonth: '66.000 đ/tháng',
      save: 'Tiết kiệm 55%',
      popular: false,
    },
  ];

  const features = [
    { icon: Eye, title: 'Xem ai đã thích bạn', desc: 'Thấy ngay ảnh rõ nét và 1-click Match tức thì' },
    { icon: RotateCcw, title: 'Lượt hoàn tác không giới hạn', desc: 'Lỡ tay quẹt bỏ qua? Quay lại dễ dàng' },
    { icon: Star, title: '5 Super Likes mỗi tuần', desc: 'Nổi bật hồ sơ và tăng 3x tỷ lệ ghép đôi' },
    { icon: Zap, title: '1 Lượt Tăng Tốc (Boost) / tháng', desc: 'Đưa bạn lên top đầu tìm kiếm trong 30 phút' },
    { icon: Sparkles, title: 'Mở khóa phân tích tương thích', desc: 'Xem chi tiết mức độ hợp nhau về lối sống, âm nhạc' },
  ];

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      upgradePremium(selectedTier);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div 
        className="w-full max-w-md max-h-[92vh] bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative shrink-0 p-5 pb-3 text-center bg-gradient-to-b from-amber-500/20 via-neutral-900 to-neutral-900 border-b border-neutral-800">
          <button
            onClick={() => setIsPremiumModalOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-neutral-950 shadow-lg shadow-amber-500/20 mb-2">
            <Crown className="w-6 h-6 fill-neutral-950" />
          </div>

          <h2 className="text-xl font-extrabold text-neutral-100">
            Nâng Cấp CupidGo VIP
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Mở khóa toàn bộ đặc quyền kết nối chân ái
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Packages Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
              Chọn gói thời hạn:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedTier === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedTier(pkg.id)}
                    className={`relative p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 left-3 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-[9px] rounded-full uppercase shadow">
                        Phổ biến nhất
                      </span>
                    )}

                    {pkg.save && (
                      <span className="inline-block text-[10px] font-semibold text-emerald-400 mb-1">
                        {pkg.save}
                      </span>
                    )}

                    <div className="text-xs font-bold text-neutral-100">{pkg.name}</div>
                    <div className="text-sm font-extrabold text-amber-400 my-0.5">
                      {pkg.price}
                    </div>
                    <div className="text-[10px] text-neutral-400">{pkg.perMonth}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-2.5 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Đặc quyền gói VIP bao gồm:
            </label>
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-amber-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-200 block">
                      {feat.title}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {feat.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Phương thức thanh toán:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'momo' as const, name: 'Ví MoMo' },
                { id: 'vnpay' as const, name: 'VNPAY QR' },
                { id: 'card' as const, name: 'Thẻ Visa/Master' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    paymentMethod === m.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Checkout CTA */}
        <div className="shrink-0 p-4 border-t border-neutral-800 bg-neutral-900">
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Thanh toán & Kích hoạt VIP ngay
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Thanh toán an toàn & bảo mật, hủy bất cứ lúc nào</span>
          </div>
        </div>
      </div>
    </div>
  );
};
