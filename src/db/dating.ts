import { eq, and, or, notInArray, desc, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { users, profiles, swipes, matches, messages, reports } from './schema.ts';
import { Profile, SwipeAction, FilterState } from '../types/index.ts';

// Helper to transform DB profile to application Profile
function toAppProfile(row: typeof profiles.$inferSelect, distanceKm = 3.5): Profile {
  let parsedPhotos: string[] = [];
  try {
    parsedPhotos = JSON.parse(row.photos);
  } catch {
    parsedPhotos = row.photos ? [row.photos] : [];
  }

  let parsedInterests: string[] = [];
  try {
    parsedInterests = JSON.parse(row.interests);
  } catch {
    parsedInterests = [];
  }

  let parsedLifestyle: any = {};
  try {
    parsedLifestyle = JSON.parse(row.lifestyle);
  } catch {
    parsedLifestyle = {};
  }

  let parsedPrompts: any = [];
  try {
    parsedPrompts = JSON.parse(row.prompts);
  } catch {
    parsedPrompts = [];
  }

  return {
    userId: row.userId,
    displayName: row.displayName,
    gender: row.gender as any,
    birthDate: row.birthDate,
    age: row.age,
    bio: row.bio,
    photos: parsedPhotos,
    locationName: row.locationName,
    latitude: parseFloat(row.latitude) || 10.7769,
    longitude: parseFloat(row.longitude) || 106.7009,
    distanceKm: distanceKm,
    targetGender: row.targetGender as any,
    minAgePref: row.minAgePref,
    maxAgePref: row.maxAgePref,
    maxDistancePref: row.maxDistancePref,
    interests: parsedInterests,
    lookingFor: row.lookingFor,
    jobTitle: row.jobTitle || undefined,
    company: row.company || undefined,
    education: row.education || undefined,
    zodiac: row.zodiac || undefined,
    heightCm: row.heightCm || undefined,
    lifestyle: parsedLifestyle,
    compatibilityRate: row.compatibilityRate,
    prompts: parsedPrompts,
    isVerified: row.isVerified,
    isBanned: row.isBanned,
  };
}

// Database initialization hook - only real users are saved and maintained
export async function seedInitialDataIfEmpty() {
  // Real user data only; no synthetic or bot profiles seeded into the database.
  return;
}

// User operations
export async function getUserByEmail(email: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to get user by email:', error);
    return null;
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to get user by uid:', error);
    return null;
  }
}

export async function createUserWithPassword(
  uid: string,
  email: string,
  passwordHash: string,
  verificationCodeHash?: string,
  verificationCodeExpiresAt?: Date
) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const inserted = await db.insert(users)
      .values({
        uid,
        email: cleanEmail,
        passwordHash,
        emailVerified: false,
        verificationCodeHash: verificationCodeHash || null,
        verificationCodeExpiresAt: verificationCodeExpiresAt || null,
        verificationAttempts: 0,
        lastVerificationSentAt: new Date(),
        isCompleted: false,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Failed to create user with password:', error);
    throw new Error('Database create user failed', { cause: error });
  }
}

export async function updateUserVerificationOtp(
  uid: string,
  verificationCodeHash: string,
  verificationCodeExpiresAt: Date
) {
  try {
    const updated = await db.update(users)
      .set({
        verificationCodeHash,
        verificationCodeExpiresAt,
        verificationAttempts: 0,
        lastVerificationSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Failed to update verification OTP:', error);
    throw new Error('Database update OTP failed', { cause: error });
  }
}

export async function markUserEmailVerified(uid: string) {
  try {
    const updated = await db.update(users)
      .set({
        emailVerified: true,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
        verificationAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Failed to mark email verified:', error);
    throw new Error('Database mark verified failed', { cause: error });
  }
}

export async function incrementVerificationAttempts(uid: string) {
  try {
    const updated = await db.update(users)
      .set({
        verificationAttempts: sql`${users.verificationAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Failed to increment attempts:', error);
    return null;
  }
}

export async function getOrCreateUser(uid: string, email: string, phoneNumber?: string, isEmailVerified = false) {
  try {
    const cleanEmail = (email || `${uid}@cupidgo.vn`).trim().toLowerCase();
    const isAdmin = cleanEmail === 'huynhlamtruong046@gmail.com';

    // 1. Check by UID first
    const byUid = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (byUid.length > 0) {
      if ((isEmailVerified || isAdmin) && !byUid[0].emailVerified) {
        await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.uid, uid));
        byUid[0].emailVerified = true;
      }
      return byUid[0];
    }

    // 2. Check by Email to unify existing records without duplicates
    const byEmail = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (byEmail.length > 0) {
      const oldUid = byEmail[0].uid;
      const updated = await db.update(users)
        .set({
          uid,
          phoneNumber: phoneNumber || byEmail[0].phoneNumber,
          emailVerified: isEmailVerified || byEmail[0].emailVerified || isAdmin,
          updatedAt: new Date(),
        })
        .where(eq(users.id, byEmail[0].id))
        .returning();

      if (oldUid !== uid) {
        // Also update profiles table to point to current Firebase UID
        await db.update(profiles).set({ userId: uid }).where(eq(profiles.userId, oldUid));
      }
      return updated[0];
    }

    // 3. Insert brand new user
    const inserted = await db.insert(users)
      .values({
        uid,
        email: cleanEmail,
        phoneNumber: phoneNumber || null,
        emailVerified: isEmailVerified || isAdmin,
        isCompleted: false,
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw new Error('Database user lookup failed', { cause: error });
  }
}

export async function updateUser(uid: string, data: Partial<typeof users.$inferInsert>) {
  try {
    const updated = await db.update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Failed to update user:', error);
    throw new Error('Database update user failed', { cause: error });
  }
}

// Profile operations
export async function getProfileByUserId(userId: string) {
  try {
    const row = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (row.length === 0) return null;
    return toAppProfile(row[0]);
  } catch (error) {
    console.error('Failed to get profile:', error);
    throw new Error('Database get profile failed', { cause: error });
  }
}

function computeAgeFromBirthDate(birthDateStr: string): number {
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function upsertProfile(userId: string, data: Partial<Profile>) {
  try {
    const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

    const calculatedAge = data.birthDate ? computeAgeFromBirthDate(data.birthDate) : (data.age || 22);
    if (calculatedAge < 18) {
      throw new Error('Bạn phải từ đủ 18 tuổi để tham gia hẹn hò trên CupidGo.');
    }

    const values = {
      userId,
      displayName: data.displayName || 'Người dùng CupidGo',
      gender: data.gender || 'OTHER',
      birthDate: data.birthDate || '2000-01-01',
      age: calculatedAge,
      bio: data.bio ?? '',
      photos: JSON.stringify(data.photos || []),
      locationName: data.locationName || 'TP. Hồ Chí Minh',
      latitude: String(data.latitude || 10.7769),
      longitude: String(data.longitude || 106.7009),
      targetGender: data.targetGender || 'BOTH',
      minAgePref: data.minAgePref || 18,
      maxAgePref: data.maxAgePref || 45,
      maxDistancePref: data.maxDistancePref || 50,
      interests: JSON.stringify(data.interests || []),
      lookingFor: data.lookingFor || 'Tìm bạn bè & hẹn hò',
      jobTitle: data.jobTitle || null,
      company: data.company || null,
      education: data.education || null,
      zodiac: data.zodiac || null,
      heightCm: data.heightCm || null,
      lifestyle: JSON.stringify(data.lifestyle || {}),
      prompts: JSON.stringify(data.prompts || []),
      compatibilityRate: data.compatibilityRate || 92,
      isVerified: data.isVerified ?? false,
      isBanned: data.isBanned ?? false,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(profiles)
        .set(values)
        .where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values(values);
    }

    // Mark user profile as completed
    await db.update(users)
      .set({ isCompleted: true, updatedAt: new Date() })
      .where(eq(users.uid, userId));

    return await getProfileByUserId(userId);
  } catch (error) {
    console.error('Failed to upsert profile:', error);
    throw new Error(error instanceof Error ? error.message : 'Database save profile failed', { cause: error });
  }
}

// Discovery Candidates: Real people registered in SQL database who are verified & completed!
export async function getCandidatesForUser(userId: string, filters?: FilterState) {
  try {
    // 1. Get IDs already swiped by this user
    const swipedRows = await db.select({ targetId: swipes.targetId })
      .from(swipes)
      .where(eq(swipes.swiperId, userId));
    const swipedIds = swipedRows.map(r => r.targetId);
    swipedIds.push(userId); // exclude self

    // 2. Fetch verified and completed users from SQL database
    const verifiedUsers = await db.select({ uid: users.uid })
      .from(users)
      .where(and(eq(users.emailVerified, true), eq(users.isCompleted, true)));
    const verifiedUserIds = new Set(verifiedUsers.map(u => u.uid));

    const allDbProfiles = await db.select().from(profiles).where(eq(profiles.isBanned, false));

    // Filter out swiped, self, and unverified accounts
    let candidates = allDbProfiles
      .filter(p => !swipedIds.includes(p.userId) && verifiedUserIds.has(p.userId))
      .map(p => toAppProfile(p));

    // Apply filtering if provided
    if (filters) {
      if (filters.gender !== 'BOTH') {
        candidates = candidates.filter(c => c.gender === filters.gender);
      }
      if (filters.verifiedOnly) {
        candidates = candidates.filter(c => c.isVerified);
      }
      candidates = candidates.filter(c => c.age >= filters.minAge && c.age <= filters.maxAge);
      if (filters.selectedInterests && filters.selectedInterests.length > 0) {
        candidates = candidates.filter(c => 
          filters.selectedInterests.some(i => c.interests.includes(i))
        );
      }
    }

    // Check if these candidates have swiped on current user
    const likesReceived = await db.select({ swiperId: swipes.swiperId })
      .from(swipes)
      .where(and(eq(swipes.targetId, userId), or(eq(swipes.action, 'LIKE'), eq(swipes.action, 'SUPER_LIKE'))));
    const likerIds = new Set(likesReceived.map(l => l.swiperId));

    candidates.forEach(c => {
      c.hasLikedCurrentUser = likerIds.has(c.userId);
    });

    return candidates;
  } catch (error) {
    console.error('Failed to get candidates:', error);
    throw new Error('Database candidates query failed', { cause: error });
  }
}

export async function getMatchById(matchId: string) {
  try {
    const rows = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to get match by id:', error);
    return null;
  }
}

// Swiping & Matching Logic
export async function recordSwipe(swiperId: string, targetId: string, action: SwipeAction) {
  try {
    // Record the swipe in SQL
    await db.insert(swipes).values({
      swiperId,
      targetId,
      action,
    });

    let isMatch = false;
    let matchId = '';

    // Check for match on LIKE or SUPER_LIKE
    if (action === 'LIKE' || action === 'SUPER_LIKE') {
      const targetSwipe = await db.select()
        .from(swipes)
        .where(
          and(
            eq(swipes.swiperId, targetId),
            eq(swipes.targetId, swiperId),
            or(eq(swipes.action, 'LIKE'), eq(swipes.action, 'SUPER_LIKE'))
          )
        )
        .limit(1);

      if (targetSwipe.length > 0) {
        isMatch = true;
        matchId = `match_${Math.min(Number(swiperId) || 0, Number(targetId) || 0)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // Insert Match in SQL database
        await db.insert(matches).values({
          id: matchId,
          user1Id: swiperId,
          user2Id: targetId,
          matchedAt: new Date(),
          lastMessage: action === 'SUPER_LIKE' ? '✨ Đã gửi Super Like!' : '🎉 Hai bạn đã tương hợp!',
          lastMessageTime: new Date(),
          unreadCountUser1: 0,
          unreadCountUser2: 0,
        });
      }
    }

    return { isMatch, matchId };
  } catch (error) {
    console.error('Failed to record swipe:', error);
    throw new Error('Database swipe failed', { cause: error });
  }
}

// Reset swipes for a user (allowing them to rediscover profiles without affecting personal data)
export async function resetSwipesForUser(userId: string) {
  try {
    await db.delete(swipes).where(eq(swipes.swiperId, userId));
    return { success: true };
  } catch (error) {
    console.error('Failed to reset swipes for user:', error);
    throw new Error('Database reset swipes failed', { cause: error });
  }
}

// Rewind last swipe
export async function rewindSwipe(swiperId: string) {
  try {
    const lastSwipe = await db.select()
      .from(swipes)
      .where(eq(swipes.swiperId, swiperId))
      .orderBy(desc(swipes.createdAt))
      .limit(1);

    if (lastSwipe.length === 0) return null;

    const row = lastSwipe[0];
    await db.delete(swipes).where(eq(swipes.id, row.id));

    // Also delete match if was created
    await db.delete(matches).where(
      or(
        and(eq(matches.user1Id, swiperId), eq(matches.user2Id, row.targetId)),
        and(eq(matches.user2Id, swiperId), eq(matches.user1Id, row.targetId))
      )
    );

    return await getProfileByUserId(row.targetId);
  } catch (error) {
    console.error('Failed to rewind swipe:', error);
    throw new Error('Database rewind failed', { cause: error });
  }
}

// Matches
export async function getMatchesForUser(userId: string) {
  try {
    const userMatches = await db.select()
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)))
      .orderBy(desc(matches.matchedAt));

    const result = [];
    for (const m of userMatches) {
      const partnerId = m.user1Id === userId ? m.user2Id : m.user1Id;
      const partnerProfile = await getProfileByUserId(partnerId);
      if (partnerProfile) {
        result.push({
          id: m.id,
          user1Id: m.user1Id,
          user2Id: m.user2Id,
          matchedAt: m.matchedAt.toISOString(),
          partnerProfile,
          lastMessage: m.lastMessage || undefined,
          lastMessageTime: m.lastMessageTime ? m.lastMessageTime.toISOString() : undefined,
          unreadCount: m.user1Id === userId ? m.unreadCountUser1 : m.unreadCountUser2,
        });
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to get matches:', error);
    throw new Error('Database matches query failed', { cause: error });
  }
}

// Messages
export async function getMessagesForMatch(matchId: string) {
  try {
    const rows = await db.select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.sentAt);

    return rows.map(r => ({
      id: r.id,
      matchId: r.matchId,
      senderId: r.senderId,
      content: r.content,
      type: r.type as 'TEXT' | 'IMAGE',
      imageUrl: r.imageUrl || undefined,
      isRead: r.isRead,
      status: (r.isRead ? 'read' : 'delivered') as 'sending' | 'sent' | 'delivered' | 'read',
      sentAt: r.sentAt.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to get messages:', error);
    throw new Error('Database messages query failed', { cause: error });
  }
}

export async function createMessage(
  matchId: string,
  senderId: string,
  content: string,
  type: 'TEXT' | 'IMAGE' = 'TEXT',
  imageUrl?: string
) {
  try {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const inserted = await db.insert(messages).values({
      id: msgId,
      matchId,
      senderId,
      content,
      type,
      imageUrl: imageUrl || null,
      isRead: false,
      sentAt: now,
    }).returning();

    // Update match last message
    await db.update(matches)
      .set({
        lastMessage: content,
        lastMessageTime: now,
      })
      .where(eq(matches.id, matchId));

    const r = inserted[0];
    return {
      id: r.id,
      matchId: r.matchId,
      senderId: r.senderId,
      content: r.content,
      type: r.type as 'TEXT' | 'IMAGE',
      imageUrl: r.imageUrl || undefined,
      isRead: r.isRead,
      status: 'delivered' as const,
      sentAt: r.sentAt.toISOString(),
    };
  } catch (error) {
    console.error('Failed to create message:', error);
    throw new Error('Database message creation failed', { cause: error });
  }
}

export async function markMessagesAsRead(matchId: string, readerId: string) {
  try {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.matchId, matchId), sql`${messages.senderId} != ${readerId}`));
    return true;
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    return false;
  }
}

// Likes You
export async function getLikesReceived(userId: string) {
  try {
    // Users who swiped LIKE or SUPER_LIKE on me, but not yet matched
    const incomingSwipes = await db.select({ swiperId: swipes.swiperId })
      .from(swipes)
      .where(
        and(
          eq(swipes.targetId, userId),
          or(eq(swipes.action, 'LIKE'), eq(swipes.action, 'SUPER_LIKE'))
        )
      );

    const swiperIds = incomingSwipes.map(s => s.swiperId);
    if (swiperIds.length === 0) return [];

    // Filter out users already swiped back
    const mySwipes = await db.select({ targetId: swipes.targetId })
      .from(swipes)
      .where(eq(swipes.swiperId, userId));
    const alreadySwipedBack = new Set(mySwipes.map(s => s.targetId));

    const pendingLikerIds = swiperIds.filter(id => !alreadySwipedBack.has(id));

    const result = [];
    for (const likerId of pendingLikerIds) {
      const p = await getProfileByUserId(likerId);
      if (p && !p.isBanned) {
        p.hasLikedCurrentUser = true;
        result.push(p);
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to get likes received:', error);
    throw new Error('Database likes query failed', { cause: error });
  }
}

// Reports and Admin Moderation
export async function createReport(reporterId: string, reportedId: string, type: 'BLOCK' | 'REPORT', reason: string) {
  try {
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(reports).values({
      id: reportId,
      reporterId,
      reportedId,
      type,
      reason,
      status: 'PENDING',
    });
    return { success: true, reportId };
  } catch (error) {
    console.error('Failed to create report:', error);
    throw new Error('Database report creation failed', { cause: error });
  }
}

export async function getAllReports() {
  try {
    const rows = await db.select().from(reports).orderBy(desc(reports.createdAt));
    const items = [];
    for (const r of rows) {
      const targetProfile = await getProfileByUserId(r.reportedId);
      const reporterProfile = await getProfileByUserId(r.reporterId);
      if (targetProfile) {
        items.push({
          id: r.id,
          reporterId: r.reporterId,
          reporterName: reporterProfile?.displayName || 'Ẩn danh',
          targetProfile,
          reason: r.reason,
          createdAt: r.createdAt.toISOString(),
          status: r.status as 'PENDING' | 'RESOLVED' | 'DISMISSED',
          actionTaken: r.actionTaken || undefined,
        });
      }
    }
    return items;
  } catch (error) {
    console.error('Failed to get reports:', error);
    throw new Error('Database reports query failed', { cause: error });
  }
}

export async function resolveReport(reportId: string, action: 'BAN' | 'DISMISS') {
  try {
    const rep = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    if (rep.length === 0) return null;

    if (action === 'BAN') {
      await db.update(profiles)
        .set({ isBanned: true })
        .where(eq(profiles.userId, rep[0].reportedId));
    }

    const updated = await db.update(reports)
      .set({
        status: action === 'BAN' ? 'RESOLVED' : 'DISMISSED',
        actionTaken: action === 'BAN' ? 'Đã khóa tài khoản vi phạm' : 'Bỏ qua báo cáo',
      })
      .where(eq(reports.id, reportId))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('Failed to resolve report:', error);
    throw new Error('Database resolve report failed', { cause: error });
  }
}

export async function getAllProfiles() {
  try {
    const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    return rows.map(r => toAppProfile(r));
  } catch (error) {
    console.error('Failed to get all profiles:', error);
    throw new Error('Database get all profiles failed', { cause: error });
  }
}

export async function toggleVerifyUser(userId: string) {
  try {
    const p = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (p.length === 0) return null;
    const newStatus = !p[0].isVerified;
    await db.update(profiles).set({ isVerified: newStatus }).where(eq(profiles.userId, userId));
    return newStatus;
  } catch (error) {
    console.error('Failed to toggle verify:', error);
    throw new Error('Database toggle verify failed', { cause: error });
  }
}

export async function toggleBanUser(userId: string) {
  try {
    const p = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (p.length === 0) return null;
    const newStatus = !p[0].isBanned;
    await db.update(profiles).set({ isBanned: newStatus }).where(eq(profiles.userId, userId));
    return newStatus;
  } catch (error) {
    console.error('Failed to toggle ban:', error);
    throw new Error('Database toggle ban failed', { cause: error });
  }
}

export async function updateUserVip(userId: string, isVip: boolean) {
  try {
    await db.update(users)
      .set({
        isPremium: isVip,
        premiumTier: isVip ? '12_months' : null,
      })
      .where(eq(users.uid, userId));
    return true;
  } catch (error) {
    console.error('Failed to update VIP:', error);
    throw new Error('Database update VIP failed', { cause: error });
  }
}

export async function getAdminStats() {
  try {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const premiumCount = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isPremium, true));
    const swipeCount = await db.select({ count: sql<number>`count(*)` }).from(swipes);
    const matchCount = await db.select({ count: sql<number>`count(*)` }).from(matches);
    const pendingReportCount = await db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, 'PENDING'));

    const premUsers = Number(premiumCount[0]?.count || 0);
    return {
      totalUsers: Number(userCount[0]?.count || 0),
      premiumUsers: premUsers,
      totalSwipes: Number(swipeCount[0]?.count || 0),
      totalMatches: Number(matchCount[0]?.count || 0),
      pendingReports: Number(pendingReportCount[0]?.count || 0),
      estimatedRevenue: premUsers * 299000,
    };
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    return {
      totalUsers: 0,
      premiumUsers: 0,
      totalSwipes: 0,
      totalMatches: 0,
      pendingReports: 0,
      estimatedRevenue: 0,
    };
  }
}

// -------------------------------------------------------------
// DATA MANAGEMENT (Direct Cloud SQL PostgreSQL Queries)
// -------------------------------------------------------------

export async function getDataManagementMetrics() {
  try {
    const [
      totalUsersRes,
      totalProfilesRes,
      activeProfilesRes,
      bannedProfilesRes,
      verifiedProfilesRes,
      premiumUsersRes,
      completedProfilesRes,
      swipesRes,
      matchesRes,
      messagesRes,
      latestUserUpdate,
      latestProfileUpdate,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(profiles),
      db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.isBanned, false)),
      db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.isBanned, true)),
      db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.isVerified, true)),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isPremium, true)),
      db.select({ count: sql<number>`count(*)` }).from(profiles).where(
        sql`${profiles.bio} IS NOT NULL AND ${profiles.bio} != '' AND ${profiles.photos} IS NOT NULL AND ${profiles.photos} != '[]'`
      ),
      db.select({ count: sql<number>`count(*)` }).from(swipes),
      db.select({ count: sql<number>`count(*)` }).from(matches),
      db.select({ count: sql<number>`count(*)` }).from(messages),
      db.select({ latest: sql<Date | null>`max(${users.updatedAt})` }).from(users),
      db.select({ latest: sql<Date | null>`max(${profiles.updatedAt})` }).from(profiles),
    ]);

    const totalAccounts = Number(totalUsersRes[0]?.count || 0);
    const totalProfiles = Number(totalProfilesRes[0]?.count || 0);
    const completedProfiles = Number(completedProfilesRes[0]?.count || 0);
    const incompleteProfiles = Math.max(0, totalAccounts - completedProfiles);
    const activeProfiles = Number(activeProfilesRes[0]?.count || 0);
    const bannedProfiles = Number(bannedProfilesRes[0]?.count || 0);
    const verifiedProfiles = Number(verifiedProfilesRes[0]?.count || 0);
    const premiumAccounts = Number(premiumUsersRes[0]?.count || 0);

    const userDate = latestUserUpdate[0]?.latest ? new Date(latestUserUpdate[0].latest) : null;
    const profileDate = latestProfileUpdate[0]?.latest ? new Date(latestProfileUpdate[0].latest) : null;
    let lastUpdated: Date | null = null;
    if (userDate && profileDate) {
      lastUpdated = userDate > profileDate ? userDate : profileDate;
    } else {
      lastUpdated = userDate || profileDate;
    }

    return {
      totalAccounts,
      totalProfiles,
      completedProfiles,
      incompleteProfiles,
      activeProfiles,
      bannedProfiles,
      verifiedProfiles,
      premiumAccounts,
      totalSwipes: Number(swipesRes[0]?.count || 0),
      totalMatches: Number(matchesRes[0]?.count || 0),
      totalMessages: Number(messagesRes[0]?.count || 0),
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
      serverTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get data management metrics:', error);
    throw new Error('Database get metrics failed', { cause: error });
  }
}

export interface DataManagementUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'BANNED' | 'VERIFIED' | 'VIP' | 'COMPLETED' | 'INCOMPLETE' | 'NO_PROFILE';
}

export async function getDataManagementUsers(query: DataManagementUserQuery) {
  try {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = query.search ? query.search.trim().toLowerCase() : '';
    const status = query.status || 'ALL';

    let baseSql = sql`
      FROM ${users} u
      LEFT JOIN ${profiles} p ON u.uid = p.user_id
      WHERE 1=1
    `;

    if (search) {
      const searchParam = `%${search}%`;
      baseSql = sql`${baseSql} AND (
        LOWER(u.uid) LIKE ${searchParam} OR
        LOWER(u.email) LIKE ${searchParam} OR
        LOWER(COALESCE(p.display_name, '')) LIKE ${searchParam}
      )`;
    }

    if (status === 'ACTIVE') {
      baseSql = sql`${baseSql} AND (p.is_banned = FALSE OR p.is_banned IS NULL)`;
    } else if (status === 'BANNED') {
      baseSql = sql`${baseSql} AND p.is_banned = TRUE`;
    } else if (status === 'VERIFIED') {
      baseSql = sql`${baseSql} AND p.is_verified = TRUE`;
    } else if (status === 'VIP') {
      baseSql = sql`${baseSql} AND u.is_premium = TRUE`;
    } else if (status === 'COMPLETED') {
      baseSql = sql`${baseSql} AND (p.bio IS NOT NULL AND p.bio != '' AND p.photos IS NOT NULL AND p.photos != '[]')`;
    } else if (status === 'INCOMPLETE') {
      baseSql = sql`${baseSql} AND (p.id IS NULL OR p.bio IS NULL OR p.bio = '' OR p.photos IS NULL OR p.photos = '[]')`;
    } else if (status === 'NO_PROFILE') {
      baseSql = sql`${baseSql} AND p.id IS NULL`;
    }

    // Count total rows
    const countQuery = sql`SELECT COUNT(*) as count ${baseSql}`;
    const countRes: any = await db.execute(countQuery);
    const totalCount = Number(countRes.rows?.[0]?.count || 0);

    // Fetch paginated rows (explicit columns to avoid leaking any sensitive fields)
    const dataQuery = sql`
      SELECT 
        u.id AS user_internal_id,
        u.uid,
        u.email,
        u.phone_number,
        u.is_premium,
        u.premium_tier,
        u.is_completed,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        p.id AS profile_id,
        p.display_name,
        p.gender,
        p.birth_date,
        p.age,
        p.bio,
        p.photos,
        p.location_name,
        p.job_title,
        p.company,
        p.is_verified,
        p.is_banned,
        p.created_at AS profile_created_at,
        p.updated_at AS profile_updated_at
      ${baseSql}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const dataRes: any = await db.execute(dataQuery);
    const rows = dataRes.rows || [];

    const items = rows.map((r: any) => {
      let photosArr: string[] = [];
      try {
        photosArr = r.photos ? JSON.parse(r.photos) : [];
      } catch {
        photosArr = r.photos ? [r.photos] : [];
      }

      const hasProfile = Boolean(r.profile_id);
      const isComplete = hasProfile && Boolean(r.bio && r.bio.trim() !== '') && photosArr.length > 0;

      return {
        uid: r.uid,
        email: r.email,
        phoneNumber: r.phone_number || null,
        isPremium: Boolean(r.is_premium),
        premiumTier: r.premium_tier || null,
        isCompletedFlag: Boolean(r.is_completed),
        displayName: r.display_name || r.email?.split('@')[0] || 'Người dùng CupidGo',
        gender: r.gender || 'OTHER',
        age: r.age || null,
        birthDate: r.birth_date || null,
        bio: r.bio || '',
        photos: photosArr,
        avatar: photosArr[0] || null,
        photosCount: photosArr.length,
        locationName: r.location_name || 'Chưa cập nhật',
        jobTitle: r.job_title || null,
        company: r.company || null,
        isVerified: Boolean(r.is_verified),
        isBanned: Boolean(r.is_banned),
        hasProfile,
        isComplete,
        userCreatedAt: r.user_created_at ? new Date(r.user_created_at).toISOString() : null,
        userUpdatedAt: r.user_updated_at ? new Date(r.user_updated_at).toISOString() : null,
        profileUpdatedAt: r.profile_updated_at ? new Date(r.profile_updated_at).toISOString() : null,
      };
    });

    return {
      users: items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  } catch (error) {
    console.error('Failed to get data management users:', error);
    throw new Error('Database get data management users failed', { cause: error });
  }
}

export async function getDataManagementUserDetail(uid: string) {
  try {
    const userRow = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (userRow.length === 0) return null;

    const u = userRow[0];
    const profileRow = await db.select().from(profiles).where(eq(profiles.userId, uid)).limit(1);
    const p = profileRow.length > 0 ? profileRow[0] : null;

    // Fetch user activity counts
    const [swipesSentRes, swipesReceivedRes, matchesRes] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(swipes).where(eq(swipes.swiperId, uid)),
      db.select({ count: sql<number>`count(*)` }).from(swipes).where(eq(swipes.targetId, uid)),
      db.select({ count: sql<number>`count(*)` }).from(matches).where(
        or(eq(matches.user1Id, uid), eq(matches.user2Id, uid))
      ),
    ]);

    let parsedPhotos: string[] = [];
    let parsedInterests: string[] = [];
    let parsedLifestyle: any = {};
    let parsedPrompts: any = [];

    if (p) {
      try { parsedPhotos = JSON.parse(p.photos); } catch { parsedPhotos = p.photos ? [p.photos] : []; }
      try { parsedInterests = JSON.parse(p.interests); } catch { parsedInterests = []; }
      try { parsedLifestyle = JSON.parse(p.lifestyle); } catch { parsedLifestyle = {}; }
      try { parsedPrompts = JSON.parse(p.prompts); } catch { parsedPrompts = []; }
    }

    return {
      user: {
        uid: u.uid,
        email: u.email,
        phoneNumber: u.phoneNumber,
        isPremium: u.isPremium,
        premiumTier: u.premiumTier,
        premiumExpiry: u.premiumExpiry,
        isCompleted: u.isCompleted,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      },
      profile: p ? {
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        gender: p.gender,
        birthDate: p.birthDate,
        age: p.age,
        bio: p.bio,
        photos: parsedPhotos,
        locationName: p.locationName,
        latitude: p.latitude,
        longitude: p.longitude,
        targetGender: p.targetGender,
        minAgePref: p.minAgePref,
        maxAgePref: p.maxAgePref,
        maxDistancePref: p.maxDistancePref,
        interests: parsedInterests,
        lookingFor: p.lookingFor,
        jobTitle: p.jobTitle,
        company: p.company,
        education: p.education,
        zodiac: p.zodiac,
        heightCm: p.heightCm,
        lifestyle: parsedLifestyle,
        prompts: parsedPrompts,
        compatibilityRate: p.compatibilityRate,
        isVerified: p.isVerified,
        isBanned: p.isBanned,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      } : null,
      stats: {
        swipesSent: Number(swipesSentRes[0]?.count || 0),
        swipesReceived: Number(swipesReceivedRes[0]?.count || 0),
        matchesCount: Number(matchesRes[0]?.count || 0),
      },
    };
  } catch (error) {
    console.error('Failed to get data management user detail:', error);
    throw new Error('Database get user detail failed', { cause: error });
  }
}

export async function getDatabaseConnectionHealth() {
  const startTime = Date.now();
  try {
    const healthResult: any = await db.execute(sql`
      SELECT 
        current_database() AS db_name,
        version() AS pg_version,
        NOW() AS server_timestamp
    `);
    const latencyMs = Date.now() - startTime;
    const info = healthResult.rows?.[0] || {};

    const [uCount, pCount, mCount, sCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(profiles),
      db.select({ count: sql<number>`count(*)` }).from(matches),
      db.select({ count: sql<number>`count(*)` }).from(swipes),
    ]);

    return {
      status: 'CONNECTED',
      databaseName: info.db_name || 'cloud_sql_development_database',
      serverVersion: info.pg_version ? info.pg_version.split(' ')[0] : 'PostgreSQL',
      serverTimestamp: info.server_timestamp,
      latencyMs,
      tableCounts: {
        users: Number(uCount[0]?.count || 0),
        profiles: Number(pCount[0]?.count || 0),
        matches: Number(mCount[0]?.count || 0),
        swipes: Number(sCount[0]?.count || 0),
      },
      healthy: true,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return {
      status: 'DISCONNECTED',
      databaseName: 'cloud_sql_development_database',
      serverVersion: 'Unknown',
      serverTimestamp: null,
      latencyMs,
      tableCounts: {},
      healthy: false,
      error: error?.message || 'Database connection error',
      checkedAt: new Date().toISOString(),
    };
  }
}
