import { Profile } from '../types';

// Zero synthetic mock profiles - CupidGo exclusively stores real users
export const INITIAL_MOCK_PROFILES: Profile[] = [];

export const AVAILABLE_INTERESTS = [
  'Cà phê',
  'Du lịch',
  'Âm nhạc',
  'Nấu ăn',
  'Đọc sách',
  'Gym & Thể thao',
  'Nhiếp ảnh',
  'Phim ảnh',
  'Board game',
  'Nuôi chó mèo',
  'Leo núi / Cắm trại',
  'Thời trang',
  'Bảo tàng & Nghệ thuật',
  'Chạy bộ',
  'Yoga & Thiền',
  'Công nghệ',
  'Làm bánh & Đồ ngọt',
  'Cocktail & Rượu vang',
  'Nhạc Indie & Jazz',
  'Chụp ảnh film'
];

export const LOOKING_FOR_OPTIONS = [
  'Người yêu lâu dài',
  'Hẹn hò tìm hiểu',
  'Tìm bạn tâm giao',
  'Chưa rõ ràng, tùy duyên'
];

export const ICEBREAKER_TEMPLATES = [
  'Chào bạn! Rất vui được tương hợp với bạn trên CupidGo ✨',
  'Chào bạn, nếu được đi du lịch bất cứ đâu vào cuối tuần này thì bạn sẽ chọn đi đâu?',
  'Hôm nay của bạn thế nào? Thấy tụi mình có chung nhiều sở thích nè!',
  'Chào bạn nha! Điểm chung lớn nhất của 2 đứa là đều mê khám phá món ngon đúng không? 🍜',
  'Rất vui được kết nối cùng bạn! Gu âm nhạc hay cà phê của bạn là gì nè?'
];

// No simulated bot auto replies - messaging is strictly real-time between real people
export const AUTO_REPLIES: Record<string, string[]> = {};
