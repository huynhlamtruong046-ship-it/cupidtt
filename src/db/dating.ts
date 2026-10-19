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
export async function getOrCreateUser(uid: string, email: string, phoneNumber?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    const inserted = await db.insert(users)
      .values({
        uid,
        email: email || `${uid}@cupidgo.vn`,
        phoneNumber: phoneNumber || null,
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

export async function upsertProfile(userId: string, data: Partial<Profile>) {
  try {
    const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

    const values = {
      userId,
      displayName: data.displayName || 'Người dùng CupidGo',
      gender: data.gender || 'OTHER',
      birthDate: data.birthDate || '2000-01-01',
      age: data.age || 24,
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
    throw new Error('Database save profile failed', { cause: error });
  }
}

// Discovery Candidates: Real people registered in SQL database!
export async function getCandidatesForUser(userId: string, filters?: FilterState) {
  try {
    // 1. Get IDs already swiped by this user
    const swipedRows = await db.select({ targetId: swipes.targetId })
      .from(swipes)
      .where(eq(swipes.swiperId, userId));
    const swipedIds = swipedRows.map(r => r.targetId);
    swipedIds.push(userId); // exclude self

    // 2. Fetch candidates from SQL database
    const allDbProfiles = await db.select().from(profiles).where(eq(profiles.isBanned, false));

    // Filter out swiped & self
    let candidates = allDbProfiles
      .filter(p => !swipedIds.includes(p.userId))
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
          lastMessage: action === 'SUPER_LIKE' ? '✨ Đã gửi Super Like cho bạn!' : '🎉 Hai bạn đã tương hợp!',
          lastMessageTime: new Date(),
          unreadCountUser1: 0,
          unreadCountUser2: 1,
        });

        // Add automated welcome message
        await db.insert(messages).values({
          id: `msg_${Date.now()}_welcome`,
          matchId: matchId,
          senderId: targetId,
          content: 'Chào bạn! Rất vui được tương hợp cùng bạn trên CupidGo ✨',
          type: 'TEXT',
          isRead: false,
          sentAt: new Date(),
        });
      }
    }

    return { isMatch, matchId };
  } catch (error) {
    console.error('Failed to record swipe:', error);
    throw new Error('Database swipe failed', { cause: error });
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
