import { ref, set, remove, onValue } from "firebase/database";
import { database } from "../firebase";
import type { Message } from "./groq";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

const getChatsLocalStorageKey = (userId: string) => `pixelcode_chats_${userId}`;

function getLocalChats(userId: string): ChatSession[] {
  try {
    const data = localStorage.getItem(getChatsLocalStorageKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Local storage error:", e);
    return [];
  }
}

function saveLocalChat(userId: string, session: ChatSession) {
  try {
    const chats = getLocalChats(userId);
    const index = chats.findIndex((c) => c.id === session.id);
    if (index >= 0) {
      // Preserve original createdAt
      session.createdAt = chats[index].createdAt || session.createdAt;
      chats[index] = session;
    } else {
      chats.push(session);
    }
    localStorage.setItem(getChatsLocalStorageKey(userId), JSON.stringify(chats));
  } catch (e) {
    console.error("Local storage save error:", e);
  }
}

function deleteLocalChat(userId: string, chatId: string) {
  try {
    const chats = getLocalChats(userId);
    const filtered = chats.filter((c) => c.id !== chatId);
    localStorage.setItem(getChatsLocalStorageKey(userId), JSON.stringify(filtered));
  } catch (e) {
    console.error("Local storage delete error:", e);
  }
}

export async function saveChatSession(
  userId: string,
  chatId: string,
  title: string,
  messages: Message[]
): Promise<void> {
  const session: ChatSession = {
    id: chatId,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages,
  };

  // Always save locally first for instant updates & fallback
  saveLocalChat(userId, session);

  try {
    const chatRef = ref(database, `chats/${userId}/${chatId}`);
    await set(chatRef, session);
  } catch (err) {
    console.warn("Failed to save to Firebase DB, falling back to LocalStorage:", err);
  }
}

export function subscribeToChats(
  userId: string,
  onUpdate: (chats: ChatSession[]) => void
): () => void {
  // Give immediate local chats so UI loads instantly
  const localChats = getLocalChats(userId);
  onUpdate(localChats.sort((a, b) => b.updatedAt - a.updatedAt));

  try {
    const userChatsRef = ref(database, `chats/${userId}`);
    const unsubscribe = onValue(
      userChatsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const sessions: ChatSession[] = Object.values(data);
          // Sync with local storage
          try {
            localStorage.setItem(getChatsLocalStorageKey(userId), JSON.stringify(sessions));
          } catch (_) {}
          onUpdate(sessions.sort((a, b) => b.updatedAt - a.updatedAt));
        } else {
          try {
            localStorage.setItem(getChatsLocalStorageKey(userId), JSON.stringify([]));
          } catch (_) {}
          onUpdate([]);
        }
      },
      (err) => {
        console.warn("Firebase DB read rejected/failed, using local storage:", err);
        onUpdate(getLocalChats(userId).sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Firebase subscribe failed, using static localStorage:", err);
    return () => {};
  }
}

export async function deleteChatSession(userId: string, chatId: string): Promise<void> {
  deleteLocalChat(userId, chatId);

  try {
    const chatRef = ref(database, `chats/${userId}/${chatId}`);
    await remove(chatRef);
  } catch (err) {
    console.warn("Failed to delete from Firebase DB:", err);
  }
}

export interface UserProfile {
  isSubscribed: boolean;
  messageCount: number;
}

const getUserProfileLocalKey = (userId: string) => `pixelcode_user_profile_${userId}`;

function getLocalUserProfile(userId: string): UserProfile {
  try {
    const data = localStorage.getItem(getUserProfileLocalKey(userId));
    if (data) return JSON.parse(data);
  } catch (_) {}
  return { isSubscribed: false, messageCount: 0 };
}

function saveLocalUserProfile(userId: string, profile: UserProfile) {
  try {
    localStorage.setItem(getUserProfileLocalKey(userId), JSON.stringify(profile));
  } catch (_) {}
}

export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile) => void
): () => void {
  // Give immediate local data
  const localProf = getLocalUserProfile(userId);
  onUpdate(localProf);

  try {
    const userRef = ref(database, `users/${userId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const profile = {
          isSubscribed: !!val.isSubscribed,
          messageCount: typeof val.messageCount === "number" ? val.messageCount : 0,
        };
        saveLocalUserProfile(userId, profile);
        onUpdate(profile);
      } else {
        // Init profile
        const profile = { isSubscribed: false, messageCount: 0 };
        set(userRef, profile);
        saveLocalUserProfile(userId, profile);
        onUpdate(profile);
      }
    }, (err) => {
      console.warn("Firebase user profile read failed, using local fallback:", err);
      onUpdate(getLocalUserProfile(userId));
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Firebase user profile subscribe failed:", err);
    return () => {};
  }
}

export async function incrementMessageCount(userId: string): Promise<number> {
  const profile = getLocalUserProfile(userId);
  profile.messageCount += 1;
  saveLocalUserProfile(userId, profile);

  try {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, profile);
  } catch (err) {
    console.warn("Failed to increment message count in Firebase:", err);
  }
  return profile.messageCount;
}

export async function setSubscriptionStatus(userId: string, isSubscribed: boolean): Promise<void> {
  const profile = getLocalUserProfile(userId);
  profile.isSubscribed = isSubscribed;
  saveLocalUserProfile(userId, profile);

  try {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, profile);
  } catch (err) {
    console.warn("Failed to set subscription status in Firebase:", err);
  }
}
