import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  deleteDoc, 
  runTransaction, 
  updateDoc 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import type { Message } from "./groq";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  agent: 'fullstack' | 'uiux' | 'designtocode' | 'general';
  projectId?: string;
}

export interface UserProfile {
  email: string;
  username: string;
  credits: number;
  subscription: boolean;
  createdAt: number;
  updatedAt: number;
  messageCount: number; // Derived virtual field for UI compatibility
  isSubscribed: boolean; // Derived virtual field for UI compatibility
  activeProjectId?: string | null; // Synced active project ID
}

/**
 * Saves a project to Firestore with localStorage fallback.
 */
export async function saveProject(
  userId: string,
  projectId: string,
  name: string
): Promise<void> {
  // Save to local storage first for instant updates & offline fallback
  const localKey = `pixelcode_projects_${userId}`;
  try {
    const existingRaw = localStorage.getItem(localKey);
    const existing: Project[] = existingRaw ? JSON.parse(existingRaw) : [];
    const idx = existing.findIndex(p => p.id === projectId);
    const updatedProj: Project = {
      id: projectId,
      name,
      createdAt: idx >= 0 ? existing[idx].createdAt : Date.now(),
      updatedAt: Date.now()
    };
    if (idx >= 0) {
      existing[idx] = updatedProj;
    } else {
      existing.unshift(updatedProj);
    }
    localStorage.setItem(localKey, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save project locally:", e);
  }

  if (!userId || userId === "guest") return;

  try {
    const projectDocRef = doc(db, "users", userId, "projects", projectId);
    const docSnap = await getDoc(projectDocRef);

    let createdAt = Date.now();
    if (docSnap.exists()) {
      createdAt = docSnap.data().createdAt || createdAt;
    }

    await setDoc(projectDocRef, {
      name,
      createdAt,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.error("Failed to save project in Firestore:", err);
  }
}

/**
 * Subscribes to projects in real-time with localStorage fallback.
 */
export function subscribeToProjects(
  userId: string,
  onUpdate: (projects: Project[]) => void,
  onError?: (err: Error) => void
): () => void {
  const getLocalProjects = (): Project[] => {
    try {
      const data = localStorage.getItem(`pixelcode_projects_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  if (!userId || userId === "guest") {
    onUpdate(getLocalProjects());
    return () => {};
  }

  try {
    const projectsCollectionRef = collection(db, "users", userId, "projects");
    const unsubscribe = onSnapshot(
      projectsCollectionRef,
      (snapshot) => {
        const list: Project[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            name: data.name || "",
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
          });
        });
        const sorted = list.sort((a, b) => b.updatedAt - a.updatedAt);
        // Backup to local storage
        try {
          localStorage.setItem(`pixelcode_projects_${userId}`, JSON.stringify(sorted));
        } catch (e) {
          console.error("Local storage projects backup failed:", e);
        }
        onUpdate(sorted);
      },
      (err) => {
        console.error("Firestore subscribeToProjects error, falling back to localStorage:", err);
        if (onError) onError(err);
        onUpdate(getLocalProjects());
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error("Firestore subscribeToProjects failed, falling back to localStorage:", err);
    if (onError) onError(err);
    onUpdate(getLocalProjects());
    return () => {};
  }
}

/**
 * Deletes a project from Firestore with localStorage fallback.
 */
export async function deleteProject(userId: string, projectId: string): Promise<void> {
  // Delete from local storage
  const localKey = `pixelcode_projects_${userId}`;
  try {
    const existingRaw = localStorage.getItem(localKey);
    if (existingRaw) {
      const existing: Project[] = JSON.parse(existingRaw);
      const filtered = existing.filter(p => p.id !== projectId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error("Failed to delete project locally:", e);
  }

  if (!userId || userId === "guest") return;

  try {
    const projectDocRef = doc(db, "users", userId, "projects", projectId);
    await deleteDoc(projectDocRef);
  } catch (err) {
    console.error("Failed to delete project from Firestore:", err);
  }
}

/**
 * Saves a chat session directly to Firestore.
 */
export async function saveChatSession(
  userId: string,
  chatId: string,
  title: string,
  messages: Message[],
  agent?: 'fullstack' | 'uiux' | 'designtocode' | 'general',
  projectId?: string
): Promise<void> {
  if (!userId || userId === "guest") return;

  try {
    const chatDocRef = doc(db, "users", userId, "chats", chatId);
    const docSnap = await getDoc(chatDocRef);
    
    let createdAt = Date.now();
    let existingProjectId: string | undefined = undefined;
    if (docSnap.exists()) {
      const data = docSnap.data();
      createdAt = data.createdAt || createdAt;
      existingProjectId = data.projectId;
    }

    await setDoc(chatDocRef, {
      title,
      messages,
      createdAt,
      updatedAt: Date.now(),
      agent: agent || 'general',
      projectId: projectId !== undefined ? projectId : (existingProjectId || null),
    }, { merge: true });
  } catch (err) {
    console.error("Failed to save chat to Firestore:", err);
    throw err;
  }
}

/**
 * Subscribes to all chat sessions for a user in real-time.
 */
export function subscribeToChats(
  userId: string,
  onUpdate: (chats: ChatSession[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId || userId === "guest") {
    onUpdate([]);
    return () => {};
  }

  try {
    const chatsCollectionRef = collection(db, "users", userId, "chats");
    const unsubscribe = onSnapshot(
      chatsCollectionRef,
      (snapshot) => {
        const sessions: ChatSession[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          sessions.push({
            id: doc.id,
            title: data.title || "",
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            messages: data.messages || [],
            agent: data.agent,
            projectId: data.projectId || undefined,
          });
        });
        // Sort by updatedAt descending
        onUpdate(sessions.sort((a, b) => b.updatedAt - a.updatedAt));
      },
      (err) => {
        console.error("Firestore subscribeToChats error:", err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error("Firestore subscribeToChats failed:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Deletes a chat session from Firestore.
 */
export async function deleteChatSession(userId: string, chatId: string): Promise<void> {
  if (!userId || userId === "guest") return;

  try {
    const chatDocRef = doc(db, "users", userId, "chats", chatId);
    await deleteDoc(chatDocRef);
  } catch (err) {
    console.error("Failed to delete chat session from Firestore:", err);
    throw err;
  }
}

/**
 * Subscribes to the user profile document in real-time.
 * If the profile does not exist in Firestore, it automatically creates it to prevent duplicates.
 */
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId || userId === "guest") {
    onUpdate({
      email: "",
      username: "Guest",
      credits: 0,
      subscription: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      isSubscribed: false,
      activeProjectId: null,
    });
    return () => {};
  }

  try {
    const userDocRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const credits = typeof data.credits === "number" ? data.credits : 25;
          const isSubscribed = !!data.subscription;
          onUpdate({
            email: data.email || "",
            username: data.username || "",
            credits: credits,
            subscription: isSubscribed,
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            messageCount: Math.max(0, 25 - credits), // Derived for UI meter count
            isSubscribed: isSubscribed,
            activeProjectId: data.activeProjectId || null,
          });
        } else {
          // Document does not exist yet. Initialize user profile in Firestore.
          const currentUser = auth.currentUser;
          const email = currentUser?.email || "";
          const username = currentUser?.displayName || email.split("@")[0] || "Developer";
          const newProfile = {
            email,
            username,
            credits: 25,
            subscription: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            activeProjectId: null,
          };
          try {
            await setDoc(userDocRef, newProfile);
          } catch (err) {
            console.error("Failed to auto-create user profile in Firestore:", err);
          }
        }
      },
      (err) => {
        console.error("Firestore subscribeToUserProfile error:", err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error("Firestore subscribeToUserProfile failed:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Increments the user's message count (decrements credits) in Firestore using a transaction.
 */
export async function incrementMessageCount(userId: string): Promise<number> {
  if (!userId || userId === "guest") return 0;

  const userDocRef = doc(db, "users", userId);
  try {
    const newCount = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User document does not exist during increment transaction.");
      }
      const data = userDoc.data();
      const currentCredits = typeof data.credits === "number" ? data.credits : 25;
      const newCredits = Math.max(0, currentCredits - 1);
      
      transaction.update(userDocRef, {
        credits: newCredits,
        updatedAt: Date.now(),
      });

      return Math.max(0, 25 - newCredits);
    });
    return newCount;
  } catch (err) {
    console.error("Transaction to decrement credits failed:", err);
    return 0;
  }
}

/**
 * Updates the user's subscription status in Firestore immediately.
 */
export async function setSubscriptionStatus(userId: string, isSubscribed: boolean): Promise<void> {
  if (!userId || userId === "guest") return;

  const userDocRef = doc(db, "users", userId);
  try {
    await updateDoc(userDocRef, {
      subscription: isSubscribed,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.error("Failed to update subscription status in Firestore:", err);
    throw err;
  }
}

/**
 * Updates the user's active project ID in Firestore to sync across devices.
 */
export async function setActiveProjectInProfile(userId: string, projectId: string | null): Promise<void> {
  if (!userId || userId === "guest") return;

  const userDocRef = doc(db, "users", userId);
  try {
    await updateDoc(userDocRef, {
      activeProjectId: projectId,
      updatedAt: Date.now(),
    });
  } catch (err) {
    // If the document doesn't exist yet, it's fine, it will be created by subscribeToUserProfile
    console.error("Failed to update active project ID in Firestore:", err);
  }
}
