import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// Users table - holds authentication and subscription state
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or unique user identifier
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  verificationCodeHash: text('verification_code_hash'),
  verificationCodeExpiresAt: timestamp('verification_code_expires_at'),
  verificationAttempts: integer('verification_attempts').default(0).notNull(),
  lastVerificationSentAt: timestamp('last_verification_sent_at'),
  phoneNumber: text('phone_number'),
  isPremium: boolean('is_premium').default(false).notNull(),
  premiumTier: text('premium_tier'),
  premiumExpiry: timestamp('premium_expiry'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  superLikesRemaining: integer('super_likes_remaining').default(5).notNull(),
  rewindRemaining: integer('rewind_remaining').default(3).notNull(),
  boostActiveUntil: timestamp('boost_active_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Profiles table - real profile information entered by users
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(), // maps to users.uid
  displayName: text('display_name').notNull(),
  gender: text('gender').notNull(), // 'MALE' | 'FEMALE' | 'OTHER'
  birthDate: text('birth_date').notNull(), // YYYY-MM-DD
  age: integer('age').notNull(),
  bio: text('bio').default('').notNull(),
  photos: text('photos').notNull(), // JSON string array of photo URLs
  locationName: text('location_name').default('TP. Hồ Chí Minh').notNull(),
  latitude: text('latitude').default('10.7769').notNull(),
  longitude: text('longitude').default('106.7009').notNull(),
  targetGender: text('target_gender').default('BOTH').notNull(),
  minAgePref: integer('min_age_pref').default(18).notNull(),
  maxAgePref: integer('max_age_pref').default(45).notNull(),
  maxDistancePref: integer('max_distance_pref').default(50).notNull(),
  interests: text('interests').default('[]').notNull(), // JSON string array
  lookingFor: text('looking_for').default('Người yêu lâu dài').notNull(),
  jobTitle: text('job_title'),
  company: text('company'),
  education: text('education'),
  zodiac: text('zodiac'),
  heightCm: integer('height_cm'),
  lifestyle: text('lifestyle').default('{}').notNull(), // JSON string
  prompts: text('prompts').default('[]').notNull(), // JSON string
  compatibilityRate: integer('compatibility_rate').default(90).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Swipes table - recorded user interactions
export const swipes = pgTable('swipes', {
  id: serial('id').primaryKey(),
  swiperId: text('swiper_id').notNull(),
  targetId: text('target_id').notNull(),
  action: text('action').notNull(), // 'LIKE' | 'PASS' | 'SUPER_LIKE'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Matches table - mutual connections between users
export const matches = pgTable('matches', {
  id: text('id').primaryKey(), // unique match ID
  user1Id: text('user1_id').notNull(),
  user2Id: text('user2_id').notNull(),
  matchedAt: timestamp('matched_at').defaultNow().notNull(),
  lastMessage: text('last_message'),
  lastMessageTime: timestamp('last_message_time'),
  unreadCountUser1: integer('unread_count_user1').default(0).notNull(),
  unreadCountUser2: integer('unread_count_user2').default(0).notNull(),
});

// Messages table - real-time chat messages
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull(),
  senderId: text('sender_id').notNull(),
  content: text('content').notNull(),
  type: text('type').default('TEXT').notNull(), // 'TEXT' | 'IMAGE'
  imageUrl: text('image_url'),
  isRead: boolean('is_read').default(false).notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

// Reports table - safety and admin moderation
export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').notNull(),
  reportedId: text('reported_id').notNull(),
  type: text('type').notNull(), // 'BLOCK' | 'REPORT'
  reason: text('reason').notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'RESOLVED' | 'DISMISSED'
  actionTaken: text('action_taken'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
