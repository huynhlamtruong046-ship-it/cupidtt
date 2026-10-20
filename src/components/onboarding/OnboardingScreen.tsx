import React, { useState, useRef } from 'react';
import { Camera, MapPin, Sparkles, ArrowRight, ArrowLeft, Image as ImageIcon, Heart, Upload, Link as LinkIcon, Database } from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { AVAILABLE_INTERESTS, LOOKING_FOR_OPTIONS } from '../../data/mockProfiles';
import { Gender, TargetGender } from '../../types';

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding, showToast } = useDating();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [photos, setPhotos] = useState<string[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [targetGender, setTargetGender] = useState<TargetGender>('FEMALE');
  const [locationName, setLocationName] = useState('TP. Hồ Chí Minh');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Cà phê',
    'Du lịch',
    'Âm nhạc',
  ]);
  const [lookingFor, setLookingFor] = useState<string>(LOOKING_FOR_OPTIONS[0]);


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (photos.length >= 6) {
      showToast('Tối đa 6 ảnh trong bộ sưu tập.');
      input.value = '';
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      showToast('Mỗi ảnh phải có dung lượng tối đa 1 MB để lưu hồ sơ ổn định.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        showToast('Không đọc được ảnh. Vui lòng thử lại.');
        return;
      }
      setPhotos((prev) => prev.length < 6 ? [result, ...prev] : prev);
      showToast('Đã thêm ảnh từ thiết bị.');
      input.value = '';
    };
    reader.onerror = () => {
      showToast('Không đọc được ảnh. Vui lòng thử lại.');
      input.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomUrl = () => {
    const value = customUrlInput.trim();
    if (!value) return;
    if (photos.length >= 6) {
      showToast('Tối đa 6 ảnh trong bộ sưu tập.');
      return;
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:' || !/\.(jpe?g|png|webp)(?:$|[?#])/i.test(parsed.pathname + parsed.search + parsed.hash)) {
        showToast('Vui lòng nhập đường dẫn ảnh HTTPS có đuôi JPG, PNG hoặc WebP.');
        return;
      }
    } catch {
      showToast('Đường dẫn ảnh không hợp lệ.');
      return;
    }
    setPhotos((prev) => [...prev, value]);
    setCustomUrlInput('');
    showToast('Đã thêm đường dẫn ảnh.');
  };

  const handleToggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length >= 6) {
        showToast('Bạn chỉ nên chọn tối đa 6 sở thích nổi bật nhất');
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleRemovePhoto = (photo: string) => {
    setPhotos((previous) => previous.filter((item) => item !== photo));
  };

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return 0;
    const birth = new Date(dateStr);
    if (Number.isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleNext = () => {
    if (step === 1) {
      if (photos.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 ảnh đại diện');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!displayName.trim()) {
        showToast('Vui lòng nhập họ và tên của bạn');
        return;
      }
      const age = calculateAge(birthDate);
      if (age < 18) {
        showToast('Vui lòng nhập ngày sinh hợp lệ. Bạn phải đủ 18 tuổi để tham gia.');
        return;
      }
      setStep(3);
    } else {
      if (selectedInterests.length < 2) {
        showToast('Vui lòng chọn ít nhất 2 sở thích');
        return;
      }

      // Finish Onboarding & Save to Cloud SQL
      completeOnboarding({
        displayName,
        gender,
        birthDate,
        age: calculateAge(birthDate),
        bio: bio.trim() || 'Rất vui được kết nối cùng bạn!',
        photos,
        locationName,
        targetGender,
        interests: selectedInterests,
        lookingFor,
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
        compatibilityRate: 95,
      });
    }
  };

  return (
    <div className="flex flex-col min-h-full justify-between p-6 bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* Progress Bar Header */}
      <div>
        <div className="flex items-center justify-between pb-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-rose-500" />
            Bước {step} / 3: Nhập thông tin thật
          </span>
          <div className="w-5" />
        </div>

        {/* Step indicator bar */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-rose-500' : 'bg-neutral-800'}`} />
          <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-rose-500' : 'bg-neutral-800'}`} />
          <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-rose-500' : 'bg-neutral-800'}`} />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 py-2">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-neutral-100">Tải ảnh thật của bạn</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Tải ảnh chụp từ điện thoại hoặc chọn ảnh đại diện để lưu vào cơ sở dữ liệu.
              </p>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Upload Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 border border-rose-500/40 rounded-xl text-xs font-semibold text-rose-300 flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4 text-rose-400" />
                <span>Tải ảnh từ máy / điện thoại</span>
              </button>
            </div>

            {/* Custom URL input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="Hoặc dán liên kết ảnh trực tiếp..."
                  className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomUrl}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium rounded-xl text-neutral-200"
              >
                Thêm
              </button>
            </div>

            {/* Selected Photos Slots */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const photo = photos[index];
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (!photo) fileInputRef.current?.click();
                    }}
                    className="relative aspect-[3/4] rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center group cursor-pointer"
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt={`Ảnh ${index + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(photo);
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center backdrop-blur-sm opacity-90 hover:opacity-100"
                        >
                          ✕
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-rose-500 text-[10px] font-bold text-white rounded">
                            Ảnh chính
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-2 text-neutral-600">
                        <Camera className="w-5 h-5 mx-auto mb-1 text-neutral-600" />
                        <span className="text-[10px] block">Thêm ảnh</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="pt-2 text-[11px] text-neutral-500">
              Hãy tải ảnh của chính bạn. Ảnh đại diện cần là ảnh bạn có quyền sử dụng; không có hồ sơ ảnh mẫu.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-neutral-100">Thông tin cá nhân</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Dữ liệu sẽ được lưu an toàn trong cơ sở dữ liệu PostgreSQL.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Họ và tên thật của bạn *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Thư"
                  required
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
                    required
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Giới tính của bạn
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Muốn tìm kiếm
                  </label>
                  <select
                    value={targetGender}
                    onChange={(e) => setTargetGender(e.target.value as TargetGender)}
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="FEMALE">Nữ giới</option>
                    <option value="MALE">Nam giới</option>
                    <option value="BOTH">Tất cả</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Thành phố sinh sống
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="TP. Hồ Chí Minh"
                      className="w-full pl-8 pr-2 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Nghề nghiệp
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Kỹ sư phần mềm"
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Công ty / Trường học
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Startup / ĐH Ngoại Thương"
                    className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Giới thiệu về bản thân (Bio)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Chia sẻ vài điều thú vị về cuộc sống, sở thích hoặc điều bạn tìm kiếm..."
                  rows={3}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-2xl font-bold text-neutral-100">Sở thích & Mục tiêu</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Thuật toán SQL sẽ tìm các đối tượng có cùng sở thích và vị trí với bạn.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Mục đích tham gia CupidGo:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LOOKING_FOR_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLookingFor(opt)}
                    className={`py-2 px-3 text-xs rounded-xl border text-left transition-colors ${
                      lookingFor === opt
                        ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-semibold'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-neutral-300">
                  Chọn sở thích ({selectedInterests.length}/6):
                </label>
                <span className="text-[10px] text-neutral-500">Tối thiểu 2 sở thích</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleToggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Next Button */}
      <div className="pt-4 border-t border-neutral-900">
        <button
          onClick={handleNext}
          className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {step < 3 ? (
            <>
              <span>Tiếp tục</span>
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 fill-white" />
              <span>Lưu hồ sơ & Bắt đầu kết đôi</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
