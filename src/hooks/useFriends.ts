/**
 * useFriends Hook
 * Friend System Management
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  orderBy,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../config/firebase";
import type { Friend } from "../types/social";

export function useFriends(userId: string | null) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time friends list
  useEffect(() => {
    if (!userId) {
      setFriends([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const friendsRef = collection(db, "users", userId, "friends");
    const q = query(friendsRef, orderBy("addedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const friendsList: Friend[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || "익명",
            photoURL: data.photoURL,
            level: data.level || 1,
            currentStreak: data.currentStreak || 0,
            totalXP: data.totalXP || 0,
            addedAt: data.addedAt?.toDate() || new Date(),
          };
        });

        setFriends(friendsList);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading friends:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Add friend (by ID, QR code, or invite link)
  const addFriend = useCallback(
    async (params: {
      friendId?: string;
      inviteCode?: string;
      qrData?: string;
    }) => {
      try {
        const addFriendFn = httpsCallable(functions, "addFriend");
        const result = await addFriendFn(params);
        return result.data;
      } catch (err: any) {
        console.error("Error adding friend:", err);
        throw new Error(err.message || "친구 추가에 실패했습니다.");
      }
    },
    []
  );

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    try {
      const removeFriendFn = httpsCallable(functions, "removeFriend");
      await removeFriendFn({ friendId });
    } catch (err: any) {
      console.error("Error removing friend:", err);
      throw new Error(err.message || "친구 삭제에 실패했습니다.");
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query: string, limit = 20) => {
    try {
      const searchUsersFn = httpsCallable(functions, "searchUsers");
      const result = await searchUsersFn({ query, limit });
      return (result.data as any).users || [];
    } catch (err: any) {
      console.error("Error searching users:", err);
      throw new Error(err.message || "사용자 검색에 실패했습니다.");
    }
  }, []);

  // Generate invite link
  const generateInviteLink = useCallback(
    async (maxUses = 10, expiresInDays = 7) => {
      try {
        const generateInviteLinkFn = httpsCallable(
          functions,
          "generateInviteLink"
        );
        const result = await generateInviteLinkFn({ maxUses, expiresInDays });
        return result.data as {
          code: string;
          inviteUrl: string;
          qrData: string;
          expiresAt: string;
          maxUses: number;
        };
      } catch (err: any) {
        console.error("Error generating invite link:", err);
        throw new Error(err.message || "초대 링크 생성에 실패했습니다.");
      }
    },
    []
  );

  return {
    friends,
    loading,
    error,
    addFriend,
    removeFriend,
    searchUsers,
    generateInviteLink,
  };
}
