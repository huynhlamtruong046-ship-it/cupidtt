import React, { useState } from 'react';
import { X, Save, Camera, Plus, Trash2 } from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { AVAILABLE_INTERESTS, LOOKING_FOR_OPTIONS } from '../../data/mockProfiles';

export const EditProfileModal: React.FC = () => {
  const { isEditProfileModalOpen, setIsEditProfileModalOpen, currentProfile, updateProfile, showToast } =
    useDating();

  const [displayName, setDisplayName] = useState(currentProfile?.displayName || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [jobTitle, setJobTitle] = useState(currentProfile?.jobTitle || '');
  const [company, setCompany] = useState(currentProfile?.company || '');
  const [education, setEducation] = useState(currentProfile?.education || '');
  const [lookingFor, setLookingFor] = useState(currentProfile?.lookingFor || LOOKING_FOR_OPTIONS[0]);
  const [interests, setInterests] = useState<string[]>(currentProfile?.interests || []);
  const [photos, setPhotos] = useState<string[]>(currentProfile?.photos || []);

  if (!isEditProfileModalOpen || !currentProfile) return null;

  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((t) => t !== tag));
    } else {
      if (interests.length >= 6) {
        showToast('Tối đa 6 sở thích');
        return;
      }
      setInterests([...interests, tag]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (photos.length <= 1) {
      showToast('Cần giữ ít nhất 1 ảnh đại diện');
      return;
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleAddSamplePhoto = (url: string) => {
    if (photos.length >= 6) {
      showToast('Tối đa 6 ảnh');
      return;
    }
    if (photos.includes(url)) return;
    setPhotos([...photos, url]);
  };

  const handleSave = () => {
    if (!displayName.trim()) {
      showToast('Họ tên không được để trống');
      return;
    }

    updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      jobTitle: jobTitle.trim() || undefined,
      company: company.trim() || undefined,
      education: education.trim() || undefined,
      lookingFor,
      interests,
      photos,
    });

    setIsEditProfileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div 
        className="w-full max-w-md max-h-[90vh] bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900">
          <h2 className="text-sm font-bold text-neutral-100">Chỉnh Sửa Hồ Sơ</h2>
          <button
            onClick={() => setIsEditProfileModalOpen(false)}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Photos Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Bộ sưu tập ảnh ({photos.length}/6)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 group"
                >
                  <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-rose-500 text-[9px] font-bold text-white rounded">
                      Ảnh bìa
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Quick add photo presets & upload */}
            {photos.length < 6 && (
              <div className="mt-3 space-y-2">
                <input
                  type="file"
                  id="edit-profile-file-input"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (photos.length < 6) {
                        setPhotos([...photos, reader.result as string]);
                        showToast('Đã thêm ảnh từ thiết bị');
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => document.getElementById('edit-profile-file-input')?.click()}
                  className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tải ảnh mới từ thiết bị</span>
                </button>

                <div className="flex gap-2">
                  {[
                    '/src/assets/images/cupid_ha_portrait_1791186074150.jpg',
                    '/src/assets/images/cupid_linh_portrait_1791186047763.jpg',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  ].map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddSamplePhoto(url)}
                      className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-700 hover:border-rose-500 active:scale-95 transition-all"
                    >
                      <img src={url} alt="Mẫu" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Họ tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Giới thiệu bản thân (Bio)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
            />
          </div>

          {/* Job & Company */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Nghề nghiệp
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ví dụ: Designer"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Công ty
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ví dụ: Studio"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Trường học
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Đại học / Cao đẳng"
              className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Looking for */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Mục tiêu tìm kiếm
            </label>
            <select
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
            >
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Interests */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Sở thích ({interests.length}/6)
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_INTERESTS.map((tag) => {
                const isSelected = interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleInterest(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-neutral-800 bg-neutral-900">
          <button
            onClick={handleSave}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};
