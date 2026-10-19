export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type TargetGender = 'MALE' | 'FEMALE' | 'BOTH';
export type SwipeAction = 'LIKE' | 'PASS' | 'SUPER_LIKE';

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  isPremium: boolean;
  premiumTier?: '1_month' | '3_months' | '6_months' | '12_months';
  premiumExpiry?: string;
  isCompleted: boolean;
  boostActiveUntil?: string; // ISO string if boost is active
  superLikesRemaining: number;
  rewindRemaining: number;
  createdAt: string;
}

export interface Profile {
  userId: string;
  displayName: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  age: number;
  bio: string;
  photos: string[];
  locationName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  targetGender: TargetGender;
  minAgePref: number;
  maxAgePref: number;
  maxDistancePref: number;
  interests: string[];
  lookingFor: string;
  jobTitle?: string;
  company?: string;
  education?: string;
  zodiac?: string;
  heightCm?: number;
  lifestyle?: {
    drinking?: string;
    smoking?: string;
    exercise?: string;
    pets?: string;
  };
  compatibilityRate: number; // e.g. 94%
  compatibilityDetails?: {
    music: number;
    lifestyle: number;
    values: number;
  };
  prompts?: Array<{
    question: string;
    answer: string;
  }>;
  hasLikedCurrentUser?: boolean; // For match detection
  isVerified?: boolean;
  isBanned?: boolean;
}

export interface SwipeRecord {
  id: string;
  swiperId: string;
  targetId: string;
  action: SwipeAction;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedAt: string;
  partnerProfile: Profile;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE';
  imageUrl?: string;
  isRead: boolean;
  status?: MessageStatus;
  sentAt: string;
}

export interface FilterState {
  gender: TargetGender;
  minAge: number;
  maxAge: number;
  maxDistance: number;
  selectedInterests: string[];
  verifiedOnly: boolean;
}

export interface BlockReportRecord {
  id: string;
  reporterId: string;
  reportedId: string;
  type: 'BLOCK' | 'REPORT';
  reason: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  targetProfile: Profile;
  reason: string;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  actionTaken?: string;
}

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalSwipes: number;
  totalMatches: number;
  pendingReports: number;
  estimatedRevenue: number;
}

