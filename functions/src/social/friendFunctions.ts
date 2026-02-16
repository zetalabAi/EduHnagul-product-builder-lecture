/**
 * Friend System Functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

function getDb() {
  return admin.firestore();
}

/**
 * Add Friend (by userId, QR code, or invite link)
 */
export const addFriend = functions.https.onCall(
  async (
    data: {
      friendId?: string;
      inviteCode?: string;
      qrData?: string;
    },
    context
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const userId = context.auth.uid;
    const db = getDb();

    let friendId: string;

    // 1. Parse friend ID from different sources
    if (data.friendId) {
      friendId = data.friendId;
    } else if (data.qrData) {
      // QR data format: "eduhangul://add-friend/{userId}"
      const match = data.qrData.match(/eduhangul:\/\/add-friend\/(.+)/);
      if (!match) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "잘못된 QR 코드입니다."
        );
      }
      friendId = match[1];
    } else if (data.inviteCode) {
      // Look up invite code
      const inviteDoc = await db
        .collection("inviteLinks")
        .doc(data.inviteCode)
        .get();

      if (!inviteDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "초대 링크를 찾을 수 없습니다."
        );
      }

      const inviteData = inviteDoc.data()!;

      // Check expiration
      if (inviteData.expiresAt.toDate() < new Date()) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "만료된 초대 링크입니다."
        );
      }

      // Check max uses
      if (inviteData.currentUses >= inviteData.maxUses) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "초대 링크 사용 횟수가 초과되었습니다."
        );
      }

      friendId = inviteData.createdBy;

      // Increment use count
      await inviteDoc.ref.update({
        currentUses: admin.firestore.FieldValue.increment(1),
      });
    } else {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "친구 ID, QR 코드, 또는 초대 링크가 필요합니다."
      );
    }

    // 2. Validate
    if (friendId === userId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "자신을 친구로 추가할 수 없습니다."
      );
    }

    // Check if already friends
    const existingFriend = await db
      .collection("users")
      .doc(userId)
      .collection("friends")
      .doc(friendId)
      .get();

    if (existingFriend.exists) {
      throw new functions.https.HttpsError(
        "already-exists",
        "이미 친구입니다."
      );
    }

    // 3. Get friend's profile
    const friendDoc = await db.collection("users").doc(friendId).get();

    if (!friendDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "사용자를 찾을 수 없습니다."
      );
    }

    const friendProfile = friendDoc.data()!;
    const userDoc = await db.collection("users").doc(userId).get();
    const userProfile = userDoc.data()!;

    // 4. Add to both users' friend lists
    const batch = db.batch();

    batch.set(
      db.collection("users").doc(userId).collection("friends").doc(friendId),
      {
        friendId,
        displayName: friendProfile.displayName || "익명",
        photoURL: friendProfile.photoURL || "",
        level: friendProfile.level || 1,
        currentStreak: friendProfile.currentStreak || 0,
        totalXP: friendProfile.totalXP || 0,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    );

    batch.set(
      db.collection("users").doc(friendId).collection("friends").doc(userId),
      {
        friendId: userId,
        displayName: userProfile.displayName || "익명",
        photoURL: userProfile.photoURL || "",
        level: userProfile.level || 1,
        currentStreak: userProfile.currentStreak || 0,
        totalXP: userProfile.totalXP || 0,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    );

    await batch.commit();

    return {
      success: true,
      friend: {
        id: friendId,
        displayName: friendProfile.displayName || "익명",
        photoURL: friendProfile.photoURL || "",
        level: friendProfile.level || 1,
      },
    };
  }
);

/**
 * Remove Friend
 */
export const removeFriend = functions.https.onCall(
  async (data: { friendId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const userId = context.auth.uid;
    const { friendId } = data;
    const db = getDb();

    // Remove from both friend lists
    const batch = db.batch();

    batch.delete(
      db.collection("users").doc(userId).collection("friends").doc(friendId)
    );

    batch.delete(
      db.collection("users").doc(friendId).collection("friends").doc(userId)
    );

    await batch.commit();

    return { success: true };
  }
);

/**
 * Search Users (by display name)
 */
export const searchUsers = functions.https.onCall(
  async (data: { query: string; limit?: number }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { query, limit = 20 } = data;
    const db = getDb();

    if (!query || query.length < 2) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "검색어는 최소 2자 이상이어야 합니다."
      );
    }

    // Simple search by display name (case-insensitive)
    // Note: For production, use Algolia or similar for better search
    const snapshot = await db
      .collection("users")
      .where("displayName", ">=", query)
      .where("displayName", "<=", query + "\uf8ff")
      .limit(limit)
      .get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        displayName: data.displayName || "익명",
        photoURL: data.photoURL || "",
        level: data.level || 1,
        totalXP: data.totalXP || 0,
      };
    });

    return { users };
  }
);

/**
 * Generate Invite Link
 */
export const generateInviteLink = functions.https.onCall(
  async (data: { maxUses?: number; expiresInDays?: number }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const userId = context.auth.uid;
    const { maxUses = 10, expiresInDays = 7 } = data;
    const db = getDb();

    // Get user profile
    const userDoc = await db.collection("users").doc(userId).get();
    const userProfile = userDoc.data()!;

    // Generate unique code
    const code = generateInviteCode();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite link document
    await db
      .collection("inviteLinks")
      .doc(code)
      .set({
        code,
        createdBy: userId,
        createdByName: userProfile.displayName || "익명",
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        maxUses,
        currentUses: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    const inviteUrl = `https://eduhangul.com/invite/${code}`;
    const qrData = `eduhangul://add-friend/${userId}`;

    return {
      code,
      inviteUrl,
      qrData,
      expiresAt: expiresAt.toISOString(),
      maxUses,
    };
  }
);

/**
 * Helper: Generate unique invite code
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
