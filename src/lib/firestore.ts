import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Session, ChatSettings } from "@/types";
import { SessionDocument, MessageDocument, UserDocument } from "@/types/backend";

// ============================================================================
// Users
// ============================================================================

export async function getUserDocument(userId: string): Promise<UserDocument | null> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserDocument;
  }

  return null;
}

// ============================================================================
// Sessions
// ============================================================================

export async function createSessionInFirestore(
  userId: string,
  settings: ChatSettings
): Promise<string> {
  const sessionRef = await addDoc(collection(db, "sessions"), {
    userId,
    title: "New conversation",
    persona: settings.persona,
    responseStyle: settings.responseStyle,
    correctionStrength: settings.correctionStrength,
    formalityLevel: settings.formalityLevel,
    rollingSummary: null,
    lastSummaryAt: null,
    summaryVersion: 0,
    messageCount: 0,
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return sessionRef.id;
}

export async function getSessionsByUser(userId: string): Promise<Session[]> {
  const q = query(
    collection(db, "sessions"),
    where("userId", "==", userId),
    orderBy("lastMessageAt", "desc"),
    limit(50)
  );

  const querySnapshot = await getDocs(q);
  const sessions: Session[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data() as SessionDocument;
    sessions.push({
      id: doc.id,
      title: data.title,
      lastMessage: "", // We'll populate this from messages if needed
      timestamp: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate() : new Date(),
    });
  });

  return sessions;
}

export async function getSession(sessionId: string): Promise<SessionDocument | null> {
  const docRef = doc(db, "sessions", sessionId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as SessionDocument;
  }

  return null;
}

export async function updateSessionSettings(
  sessionId: string,
  settings: Partial<ChatSettings>
): Promise<void> {
  const docRef = doc(db, "sessions", sessionId);
  await updateDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const docRef = doc(db, "sessions", sessionId);
  await deleteDoc(docRef);
}

// ============================================================================
// Messages
// ============================================================================

export async function getMessagesBySession(sessionId: string, userId?: string): Promise<MessageDocument[]> {
  const constraints = [
    where("sessionId", "==", sessionId),
    orderBy("createdAt", "asc")
  ];

  // Add userId filter if provided (for Firestore security rules)
  if (userId) {
    constraints.unshift(where("userId", "==", userId));
  }

  const q = query(
    collection(db, "messages"),
    ...constraints
  );

  const querySnapshot = await getDocs(q);
  const messages: MessageDocument[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    messages.push({
      id: doc.id,
      sessionId: data.sessionId,
      userId: data.userId,
      role: data.role,
      content: data.content,
      learningTip: data.learningTip || null,
      audioUrl: data.audioUrl || null,
      durationSeconds: data.durationSeconds || null,
      modelUsed: data.modelUsed || null,
      inputTokens: data.inputTokens || null,
      outputTokens: data.outputTokens || null,
      latencyMs: data.latencyMs || null,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    } as unknown as MessageDocument);
  });

  return messages;
}

export async function addMessage(
  sessionId: string,
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<string> {
  const messageRef = await addDoc(collection(db, "messages"), {
    sessionId,
    userId,
    role,
    content,
    modelUsed: null,
    inputTokens: null,
    outputTokens: null,
    latencyMs: null,
    createdAt: serverTimestamp(),
  });

  return messageRef.id;
}
