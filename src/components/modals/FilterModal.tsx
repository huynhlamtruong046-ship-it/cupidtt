import React, { useState } from 'react';
import { X, SlidersHorizontal, Check, RefreshCw } from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { AVAILABLE_INTERESTS } from '../../data/mockProfiles';
import { TargetGender } from '../../types';

export const FilterModal: React.FC = () => {
  const { isFilterModalOpen, setIsFilterModalOpen, filters, updateFilters } = useDating();

  const [localGender, setLocalGender] = useState<TargetGender>(filters.gender);
  const [localMinAge, setLocalMinAge] = useState(filters.minAge);
  const [localMaxAge, setLocalMaxAge] = useState(filters.maxAge);
  const [localDistance, setLocalDistance] = useState(filters.maxDistance);
  const [localInterests, setLocalInterests] = useState<string[]>(filters.selectedInterests);
  const [localVerifiedOnly, setLocalVerifiedOnly] = useState(filters.verifiedOnly);

  if (!isFilterModalOpen) return null;

  const handleApply = () => {
    updateFilters({
      gender: localGender,
      minAge: localMinAge,
      maxAge: localMaxAge,
      maxDistance: localDistance,
      selectedInterests: localInterests,
      verifiedOnly: localVerifiedOnly,
    });
    setIsFilterModalOpen(false);
  };

  const handleReset = () => {
    setLocalGender('BOTH');
    setLocalMinAge(18);
    setLocalMaxAge(40);
    setLocalDistance(50);
    setLocalInterests([]);
    setLocalVerifiedOnly(false);
  };

  const toggleInterest = (tag: string) => {
    if (localInterests.includes(tag)) {
      setLocalInterests(localInterests.filter((t) => t !== tag));
    } else {
      setLocalInterests([...localInterests, tag]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div 
        className="w-full max-w-md max-h-[90vh] bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-neutral-100">Bộ Lọc Tìm Kiếm</h2>
          </div>
          <button
            onClick={() => setIsFilterModalOpen(false)}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Gender Preference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Đối tượng quan tâm
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'FEMALE', label: 'Nữ' },
                  { id: 'MALE', label: 'Nam' },
                  { id: 'BOTH', label: 'Tất cả' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalGender(opt.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    localGender === opt.id
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Khoảng cách tối đa
              </label>
              <span className="text-xs font-bold text-rose-400">{localDistance} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={localDistance}
              onChange={(e) => setLocalDistance(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
              <span>5 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Age Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Độ tuổi mong muốn
              </label>
              <span className="text-xs font-bold text-rose-400">
                {localMinAge} - {localMaxAge} tuổi
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Từ tuổi:</span>
                <input
                  type="number"
                  min="18"
                  max={localMaxAge}
                  value={localMinAge}
                  onChange={(e) => setLocalMinAge(Math.max(18, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Đến tuổi:</span>
                <input
                  type="number"
                  min={localMinAge}
                  max="60"
                  value={localMaxAge}
                  onChange={(e) => setLocalMaxAge(Math.min(60, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Interests Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Lọc theo sở thích
              </label>
              {localInterests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLocalInterests([])}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Xóa lọc
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {AVAILABLE_INTERESTS.map((tag) => {
                const isSelected = localInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verified toggle */}
          <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-200 block">
                Chỉ hiện hồ sơ đã xác thực
              </span>
              <span className="text-[10px] text-neutral-500">
                Tăng độ an toàn & tin cậy
              </span>
            </div>
            <input
              type="checkbox"
              checked={localVerifiedOnly}
              onChange={(e) => setLocalVerifiedOnly(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 border-t border-neutral-800 bg-neutral-900 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="p-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Đặt lại"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Đặt lại
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
};
