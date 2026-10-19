import React, { useState } from 'react';
import { X, UserPlus, Camera, Sparkles, MapPin, Briefcase } from 'lucide-react';
import { Profile, Gender, TargetGender } from '../../types';
import { AVAILABLE_INTERESTS, LOOKING_FOR_OPTIONS } from '../../data/mockProfiles';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (profile: Profile) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState(24);
  const [gender, setGender] = useState<Gender>('FEMALE');
  const [targetGender, setTargetGender] = useState<TargetGender>('MALE');
  const [locationName, setLocationName] = useState('Hà Nội');
  const [jobTitle, setJobTitle] = useState('Content Creator');
  const [company, setCompany] = useState('Media Agency');
  const [bio, setBio] = useState('Thích cà phê sáng, âm nhạc indie và chụp ảnh film.');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Cà phê', 'Nhiếp ảnh', 'Âm nhạc']);
  const [lookingFor, setLookingFor] = useState(LOOKING_FOR_OPTIONS[0]);
  const [isVerified, setIsVerified] = useState(true);

  if (!isOpen) return null;

  const sampleAvatars = [
    '/src/assets/images/cupid_linh_portrait_1791186047763.jpg',
    '/src/assets/images/cupid_minh_portrait_1791186060876.jpg',
    '/src/assets/images/cupid_ha_portrait_1791186074150.jpg',
    '/src/assets/images/cupid_tuan_portrait_1791186089711.jpg',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    const newProfile: Profile = {
      userId: `user_admin_${Date.now()}`,
      displayName: displayName.trim(),
      gender,
      birthDate: `${2026 - age}-05-20`,
      age,
      bio: bio.trim(),
      photos: [photoUrl],
      locationName,
      latitude: 21.0285,
      longitude: 105.8542,
      distanceKm: Math.floor(Math.random() * 8) + 1,
      targetGender,
      minAgePref: Math.max(18, age - 5),
      maxAgePref: age + 8,
      maxDistancePref: 30,
      interests: selectedInterests,
      lookingFor,
      jobTitle,
      company,
      compatibilityRate: Math.floor(Math.random() * 15) + 85,
      isVerified,
      hasLikedCurrentUser: true,
    };

    onAdd(newProfile);
    onClose();
  };

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Thêm Hồ Sơ Mới Vào Hệ Thống</h3>
              <p className="text-[11px] text-neutral-400">Hồ sơ sẽ hiển thị ngay trong danh sách khám phá của người dùng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Avatar choice */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              Ảnh đại diện:
            </label>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Nhập URL ảnh..."
                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
              />
              <input
                type="file"
                id="admin-user-photo-upload"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPhotoUrl(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById('admin-user-photo-upload')?.click()}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 rounded-xl font-medium shrink-0"
              >
                Tải từ máy
              </button>
            </div>
            <div className="flex gap-2">
              {sampleAvatars.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoUrl(url)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    photoUrl === url ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Name & Age */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-neutral-400 mb-1 font-medium">Họ và tên *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ví dụ: Diệu Linh..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Độ tuổi</label>
              <input
                type="number"
                min="18"
                max="60"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Gender & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-rose-500"
              >
                <option value="FEMALE">Nữ</option>
                <option value="MALE">Nam</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Khu vực</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Hà Nội, TP.HCM..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Job & Company */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Nghề nghiệp</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Công ty / Cơ quan</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-neutral-400 mb-1 font-medium">Đôi lời giới thiệu (Bio)</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-neutral-400 mb-1.5 font-medium">Sở thích</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {AVAILABLE_INTERESTS.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                    selectedInterests.includes(tag)
                      ? 'bg-rose-500 text-white font-medium'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Verified toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="verifyToggle"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-4 h-4 rounded accent-rose-500"
            />
            <label htmlFor="verifyToggle" className="text-xs text-neutral-300 cursor-pointer">
              Cấp ngay huy hiệu tích xanh xác thực (Verified)
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-medium rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              Lưu & Kích hoạt hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
