import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Sparkles,
  Phone,
  Video,
  MoreVertical,
  Shield,
  Flag,
  Check,
  CheckCheck,
  Smile,
  X,
  Clock,
} from 'lucide-react';
import { useDating } from '../../context/DatingContext';
import { ICEBREAKER_TEMPLATES } from '../../data/mockProfiles';
import { CardDetailSheet } from '../discovery/CardDetailSheet';

interface ChatScreenProps {
  matchId: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ matchId, onBack }) => {
  const {
    matches,
    messages,
    sendMessage,
    currentUser,
    setBlockReportModal,
    showToast,
  } = useDating();

  const match = matches.find((m) => m.id === matchId);
  const chatMessages = messages[matchId] || [];

  const [inputContent, setInputContent] = useState('');
  const [showIcebreakers, setShowIcebreakers] = useState(chatMessages.length === 0);
  const [showDetail, setShowDetail] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  if (!match) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-950 text-neutral-100">
        <p className="text-sm text-neutral-400 mb-4">Không tìm thấy cuộc trò chuyện</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-neutral-800 text-neutral-200 rounded-xl text-xs"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const partner = match.partnerProfile;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;

    sendMessage(matchId, inputContent.trim(), 'TEXT');
    setInputContent('');
    setShowIcebreakers(false);
  };

  const handleSendIcebreaker = (text: string) => {
    sendMessage(matchId, text, 'TEXT');
    setShowIcebreakers(false);
  };

  const handleSendSampleImage = (url: string) => {
    sendMessage(matchId, '', 'IMAGE', url);
    setIsPhotoPickerOpen(false);
    showToast('Đã gửi ảnh thành công');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden relative">
      {/* Chat Header */}
      <header className="shrink-0 flex items-center justify-between px-3 py-2.5 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowDetail(true)}
            className="flex items-center gap-2.5 text-left group min-w-0"
          >
            <div className="relative shrink-0">
              <img
                src={partner.photos[0]}
                alt={partner.displayName}
                className="w-9 h-9 rounded-full object-cover border border-neutral-700"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-neutral-900 rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-neutral-100 truncate group-hover:text-rose-400 transition-colors">
                  {partner.displayName}
                </span>
                {partner.isVerified && (
                  <Shield className="w-3 h-3 text-blue-400 fill-blue-400/20 shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-emerald-400 block truncate">
                Đang trực tuyến
              </span>
            </div>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-neutral-400">
          <button
            onClick={() => showToast('Tính năng gọi thoại sẽ sớm ra mắt')}
            className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center transition-colors"
            title="Gọi thoại"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => showToast('Tính năng gọi video bảo mật sẽ sớm ra mắt')}
            className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center transition-colors"
            title="Gọi video"
          >
            <Video className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center transition-colors"
              title="Tùy chọn"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <button
                  onClick={() => {
                    setShowDetail(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-neutral-200 hover:bg-neutral-800 transition-colors"
                >
                  Xem hồ sơ đầy đủ
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setBlockReportModal({ target: partner, type: 'REPORT' });
                  }}
                  className="w-full px-3 py-2 text-left text-rose-400 hover:bg-neutral-800 transition-colors flex items-center gap-2"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Báo cáo người này
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setBlockReportModal({ target: partner, type: 'BLOCK' });
                  }}
                  className="w-full px-3 py-2 text-left text-neutral-400 hover:bg-neutral-800 transition-colors"
                >
                  Chặn cuộc trò chuyện
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Match celebration badge */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-[11px] text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Bạn và {partner.displayName} đã tương hợp!</span>
          </div>
        </div>

        {chatMessages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              <div
                className={`max-w-[78%] rounded-2xl p-3 text-xs leading-relaxed ${
                  isMe
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-none shadow-md shadow-rose-500/10'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-bl-none'
                }`}
              >
                {msg.type === 'IMAGE' && msg.imageUrl ? (
                  <div className="rounded-xl overflow-hidden mb-1 max-h-48">
                    <img
                      src={msg.imageUrl}
                      alt="Ảnh chia sẻ"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null}
                {msg.content && <p>{msg.content}</p>}
              </div>

              {/* Timestamp & read/delivered status */}
              <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-neutral-500">
                <span>{msg.sentAt}</span>
                {isMe && (
                  <>
                    {(msg.status === 'read' || msg.isRead) ? (
                      <span
                        className="inline-flex items-center gap-0.5 text-rose-400 font-medium"
                        title="Đã xem (Read)"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-rose-400 stroke-[2.2]" />
                        <span className="text-[9px]">Đã xem</span>
                      </span>
                    ) : msg.status === 'delivered' ? (
                      <span
                        className="inline-flex items-center gap-0.5 text-neutral-400"
                        title="Đã nhận (Delivered)"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-[9px]">Đã nhận</span>
                      </span>
                    ) : msg.status === 'sending' ? (
                      <span
                        className="inline-flex items-center gap-0.5 text-neutral-500"
                        title="Đang gửi..."
                      >
                        <Clock className="w-3 h-3 text-neutral-500 animate-pulse" />
                        <span className="text-[9px]">Đang gửi</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-0.5 text-neutral-500"
                        title="Đã gửi (Sent)"
                      >
                        <Check className="w-3 h-3 text-neutral-500" />
                        <span className="text-[9px]">Đã gửi</span>
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Icebreaker suggestions drawer */}
      {showIcebreakers && (
        <div className="shrink-0 p-3 bg-neutral-900/90 border-t border-neutral-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Gợi ý câu mở lời thông minh:
            </span>
            <button
              onClick={() => setShowIcebreakers(false)}
              className="text-[10px] text-neutral-500 hover:text-neutral-300"
            >
              Ẩn đi
            </button>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {ICEBREAKER_TEMPLATES.map((icebreaker, i) => (
              <button
                key={i}
                onClick={() => handleSendIcebreaker(icebreaker)}
                className="w-full text-left p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 hover:border-rose-500/40 text-xs text-neutral-300 hover:text-rose-200 transition-colors"
              >
                {icebreaker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="shrink-0 p-3 bg-neutral-900/95 border-t border-neutral-800">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Photo trigger */}
          <button
            type="button"
            onClick={() => setIsPhotoPickerOpen(!isPhotoPickerOpen)}
            className="w-9 h-9 rounded-xl bg-neutral-800 text-neutral-300 hover:text-rose-400 flex items-center justify-center shrink-0 transition-colors"
            title="Gửi hình ảnh"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Icebreaker toggle trigger */}
          <button
            type="button"
            onClick={() => setShowIcebreakers(!showIcebreakers)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              showIcebreakers
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-neutral-800 text-neutral-300 hover:text-rose-400'
            }`}
            title="Gợi ý thả thính"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Nhắn tin cho người ấy..."
            className="flex-1 px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputContent.trim()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              inputContent.trim()
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20 active:scale-95'
                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Photo Picker Modal */}
      {isPhotoPickerOpen && (
        <div className="absolute bottom-16 left-3 right-3 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-30 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-300">
              Gửi một bức ảnh trong cuộc trò chuyện:
            </span>
            <button
              onClick={() => setIsPhotoPickerOpen(false)}
              className="text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80',
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
            ].map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => handleSendSampleImage(imgUrl)}
                className="aspect-square rounded-xl overflow-hidden border border-neutral-700 hover:border-rose-500 active:scale-95 transition-all"
              >
                <img src={imgUrl} alt="Chọn ảnh" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Partner Detail Sheet if opened */}
      {showDetail && (
        <CardDetailSheet
          profile={partner}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
};
