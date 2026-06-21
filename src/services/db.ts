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

const LOCAL_STORAGE_KEY = "pixelcode_chats_fallback";

function getLocalChats(): ChatSession[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Local storage error:", e);
    return [];
  }
}

function saveLocalChat(session: ChatSession) {
  try {
    const chats = getLocalChats();
    const index = chats.findIndex((c) => c.id === session.id);
    if (index >= 0) {
      // Preserve original createdAt
      session.createdAt = chats[index].createdAt || session.createdAt;
      chats[index] = session;
    } else {
      chats.push(session);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error("Local storage save error:", e);
  }
}

function deleteLocalChat(chatId: string) {
  try {
    const chats = getLocalChats();
    const filtered = chats.filter((c) => c.id !== chatId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
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
  saveLocalChat(session);

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
  const localChats = getLocalChats();
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
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
          } catch (_) {}
          onUpdate(sessions.sort((a, b) => b.updatedAt - a.updatedAt));
        } else {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
          } catch (_) {}
          onUpdate([]);
        }
      },
      (err) => {
        console.warn("Firebase DB read rejected/failed, using local storage:", err);
        onUpdate(getLocalChats().sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Firebase subscribe failed, using static localStorage:", err);
    return () => {};
  }
}

export async function deleteChatSession(userId: string, chatId: string): Promise<void> {
  deleteLocalChat(chatId);

  try {
    const chatRef = ref(database, `chats/${userId}/${chatId}`);
    await remove(chatRef);
  } catch (err) {
    console.warn("Failed to delete from Firebase DB:", err);
  }
}
