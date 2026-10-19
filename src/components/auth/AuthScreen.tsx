import React, { useState } from 'react';
import { Heart, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, UserPlus, LogIn, Database } from 'lucide-react';
import { useDating } from '../../context/DatingContext';

export const AuthScreen: React.FC = () => {
  const { login, loginWithGoogle, register, showToast, isDbConnected } = useDating();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    if (mode === 'forgot') {
      showToast(`Đã gửi liên kết khôi phục mật khẩu đến ${email}`);
      setMode('login');
      return;
    }

    if (!password) {
      showToast('Vui lòng nhập mật khẩu');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'login') {
        login(email, false);
        showToast('Đăng nhập thành công! Đang tải dữ liệu...');
      } else {
        register(email);
        showToast('Đăng ký tài khoản thành công! Hãy nhập thông tin cá nhân của bạn.');
      }
    }, 500);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      showToast('Không thể kết nối Google Login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login('khoa.nguyen@cupidgo.vn', true);
      showToast('Đã đăng nhập tài khoản Đăng Khoa (VIP)');
    }, 400);
  };

  const handleQuickNewUser = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      register(`nguoidung_${Math.floor(Math.random() * 900 + 100)}@gmail.com`);
      showToast('Bắt đầu quy trình tạo hồ sơ người thật');
    }, 300);
  };

  return (
    <div className="flex flex-col min-h-full justify-between p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 overflow-y-auto">
      {/* Brand Header */}
      <div className="pt-6 pb-2 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-400 p-0.5 shadow-xl shadow-rose-500/20 mb-3 animate-in fade-in zoom-in duration-300">
          <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
          CupidGo
        </h1>
        <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
          Cơ sở dữ liệu đám mây PostgreSQL lưu trữ người thật 100%
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-sm mx-auto bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
        {/* Google One-Click Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 mb-4 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Đăng nhập nhanh với Google</span>
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-[11px]">
            <span className="bg-neutral-900 px-2 text-neutral-500">Hoặc sử dụng email cá nhân</span>
          </div>
        </div>

        <div className="flex border-b border-neutral-800 mb-4">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 pb-2.5 text-xs font-semibold text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 pb-2.5 text-xs font-semibold text-center transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@gmail.com"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-neutral-400">
                  Mật khẩu
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-3.5 h-3.5" />
                Đăng nhập
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Đăng ký & Nhập hồ sơ thật
              </>
            ) : (
              'Gửi liên kết khôi phục'
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="w-full mt-3 text-xs text-center text-neutral-400 hover:text-neutral-200"
          >
            Quay lại Đăng nhập
          </button>
        )}

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="bg-neutral-900 px-2 text-neutral-500">Tiện ích thử nghiệm</span>
          </div>
        </div>

        {/* Demo Fast Logins for Testing */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleQuickNewUser}
            className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-rose-400" />
              <span>Tạo hồ sơ người thật mới ngay</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
          </button>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2 px-3 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 rounded-xl text-xs font-medium text-neutral-300 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Hồ sơ mẫu có sẵn (Đăng Khoa VIP)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Safety Notice & Footer */}
      <div className="pt-4 pb-2 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Cơ sở dữ liệu Cloud SQL bảo mật, mã hóa dữ liệu 100%</span>
      </div>
    </div>
  );
};
