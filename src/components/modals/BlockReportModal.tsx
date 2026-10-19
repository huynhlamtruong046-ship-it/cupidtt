import React, { useState } from 'react';
import { X, ShieldAlert, Flag, Ban } from 'lucide-react';
import { useDating } from '../../context/DatingContext';

export const BlockReportModal: React.FC = () => {
  const { blockReportModal, setBlockReportModal, blockUser, reportUser } = useDating();

  const [reason, setReason] = useState('Nội dung không phù hợp hoặc quấy rối');
  const [customDetail, setCustomDetail] = useState('');

  if (!blockReportModal) return null;

  const { target, type } = blockReportModal;

  const reasons = [
    'Tài khoản giả mạo danh tính người khác',
    'Nội dung hình ảnh hoặc ngôn từ không phù hợp',
    'Hành vi quấy rối hoặc thô lỗ trong tin nhắn',
    'Lừa đảo tài chính hoặc mua bán trái phép',
    'Spam quảng cáo hoặc chia sẻ link độc hại',
    'Khác',
  ];

  const handleConfirm = () => {
    if (type === 'BLOCK') {
      blockUser(target.userId);
    } else {
      const fullReason = customDetail ? `${reason}: ${customDetail}` : reason;
      reportUser(target.userId, fullReason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl text-neutral-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {type === 'BLOCK' ? (
              <Ban className="w-5 h-5 text-rose-500" />
            ) : (
              <Flag className="w-5 h-5 text-rose-500" />
            )}
            <h3 className="text-sm font-bold">
              {type === 'BLOCK' ? `Chặn ${target.displayName}` : `Báo cáo vi phạm`}
            </h3>
          </div>
          <button
            onClick={() => setBlockReportModal(null)}
            className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed mb-4">
          {type === 'BLOCK'
            ? `Bạn sẽ không nhìn thấy hồ sơ của ${target.displayName} nữa và người này cũng không thể tìm thấy hoặc nhắn tin cho bạn.`
            : `Đội ngũ quản trị an toàn của CupidGo sẽ kiểm duyệt hồ sơ của ${target.displayName} và xử lý vi phạm trong vòng 24h.`}
        </p>

        {type === 'REPORT' && (
          <div className="space-y-3 mb-4">
            <label className="block text-xs font-semibold text-neutral-400">
              Chọn lý do báo cáo:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors ${
                    reason === r
                      ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-medium'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={customDetail}
              onChange={(e) => setCustomDetail(e.target.value)}
              placeholder="Chi tiết bổ sung (tùy chọn)..."
              rows={2}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBlockReportModal(null)}
            className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-colors"
          >
            {type === 'BLOCK' ? 'Xác nhận chặn' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};
