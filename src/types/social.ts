/**
 * Social Features Types
 * Friend System & Challenges
 */

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export type ChallengeType = "streak" | "xp" | "lessons";

export type ChallengeStatus = "active" | "completed" | "expired";

export interface Friend {
  id: string;
  displayName: string;
  photoURL?: string;
  level: number;
  currentStreak: number;
  totalXP: number;
  addedAt: Date;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  respondedAt?: Date;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  createdBy: string;
  createdByName: string;
  participants: string[]; // [userId1, userId2]
  participantNames: string[]; // [name1, name2]
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date;
  goal: number; // e.g., 7 days streak, 1000 XP, 10 lessons
  progress: {
    [userId: string]: number;
  };
  winner?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CheerMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  message: string;
  emoji: string; // e.g., "🎉", "💪", "🔥"
  createdAt: Date;
  read: boolean;
}

export interface InviteLink {
  code: string;
  createdBy: string;
  createdByName: string;
  expiresAt: Date;
  maxUses: number;
  currentUses: number;
}

/**
 * Firestore Structure:
 *
 * users/{userId}/friends/{friendId}
 * {
 *   friendId: string,
 *   displayName: string,
 *   photoURL: string,
 *   level: number,
 *   currentStreak: number,
 *   totalXP: number,
 *   addedAt: Timestamp
 * }
 *
 * friendRequests/{requestId}
 * {
 *   fromUserId: string,
 *   fromUserName: string,
 *   fromUserPhoto: string,
 *   toUserId: string,
 *   status: "pending" | "accepted" | "declined",
 *   createdAt: Timestamp,
 *   respondedAt: Timestamp
 * }
 *
 * challenges/{challengeId}
 * {
 *   type: "streak" | "xp" | "lessons",
 *   createdBy: string,
 *   createdByName: string,
 *   participants: [userId1, userId2],
 *   participantNames: [name1, name2],
 *   status: "active" | "completed" | "expired",
 *   startDate: Timestamp,
 *   endDate: Timestamp,
 *   goal: number,
 *   progress: { userId1: 5, userId2: 3 },
 *   winner: string,
 *   createdAt: Timestamp,
 *   completedAt: Timestamp
 * }
 *
 * cheerMessages/{messageId}
 * {
 *   fromUserId: string,
 *   fromUserName: string,
 *   fromUserPhoto: string,
 *   toUserId: string,
 *   message: string,
 *   emoji: string,
 *   createdAt: Timestamp,
 *   read: boolean
 * }
 *
 * inviteLinks/{code}
 * {
 *   code: string,
 *   createdBy: string,
 *   createdByName: string,
 *   expiresAt: Timestamp,
 *   maxUses: number,
 *   currentUses: number
 * }
 */
