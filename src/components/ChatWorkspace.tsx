import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { auth } from "../firebase";
import { type Message, streamGroqCompletion } from "../services/groq";
import { 
  type ChatSession, 
  saveChatSession, 
  subscribeToChats, 
  deleteChatSession,
  type UserProfile,
  subscribeToUserProfile,
  incrementMessageCount
} from "../services/db";
import { SubscriptionModal } from "./SubscriptionModal";
import "./ChatWorkspace.css";

export const ChatWorkspace: React.FC = () => {
  const user = auth.currentUser;
  const userId = user?.uid || "guest";

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  // Clear state when userId changes to prevent bleed
  useEffect(() => {
    setChats([]);
    setActiveChatId(null);
    setProfile(null);
  }, [userId]);

  // Subscribe to user usage and subscription profile details
  useEffect(() => {
    const unsubscribe = subscribeToUserProfile(userId, (updatedProfile) => {
      setProfile(updatedProfile);
    });
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Subscribe to real-time chats from database
  useEffect(() => {
    const unsubscribe = subscribeToChats(userId, (updatedChats) => {
      setChats(updatedChats);
      
      // Auto-select the most recent chat if none is active and chats exist
      if (updatedChats.length > 0 && !activeChatId) {
        // Find if there is a session already
        setActiveChatId(updatedChats[0].id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Cancel any streaming request when changing chats
  useEffect(() => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  }, [activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const currentMessages = activeChat ? activeChat.messages || [] : [];
  const chatTitle = activeChat ? activeChat.title : "New Conversation";

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewChat = () => {
    const newId = Math.random().toString(36).substring(2, 15);
    setActiveChatId(newId);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Update state immediately for instant visual deletion
    const remainingChats = chats.filter((c) => c.id !== id);
    setChats(remainingChats);
    
    // If active chat is deleted, reset selection
    if (activeChatId === id) {
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id);
      } else {
        setActiveChatId(null);
      }
    }
    
    await deleteChatSession(userId, id);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChatId || !activeChat) return;
    const updatedMessages = activeChat.messages.filter((m) => m.id !== messageId);
    
    setChats(prevChats => 
      prevChats.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: updatedMessages };
        }
        return c;
      })
    );

    await saveChatSession(userId, activeChatId, activeChat.title, updatedMessages, activeChat.agent);
  };

  const handleRegenerateMessage = async (messageId: string) => {
    if (!activeChatId || !activeChat || isLoading) return;
    const msgIndex = activeChat.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const previousMessages = activeChat.messages.slice(0, msgIndex);
    const lastUserMessage = previousMessages.filter((m) => m.role === "user").pop();
    if (!lastUserMessage) return;

    const messagesToKeep = activeChat.messages.slice(0, activeChat.messages.indexOf(lastUserMessage));
    
    setChats(prevChats => 
      prevChats.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: messagesToKeep };
        }
        return c;
      })
    );

    await saveChatSession(userId, activeChatId, activeChat.title, messagesToKeep, activeChat.agent);
    await handleSendMessage(lastUserMessage.content);
  };

  const handleSendMessage = async (content: string) => {
    // Check if free user limit is reached
    if (profile && !profile.isSubscribed && profile.messageCount >= 25) {
      setIsBillingOpen(true);
      return;
    }

    const currentId = activeChatId || Math.random().toString(36).substring(2, 15);
    if (!activeChatId) {
      setActiveChatId(currentId);
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...currentMessages, userMessage];
    
    // Infer chat title from user's first message
    const currentTitle = activeChat ? activeChat.title : (content.length > 25 ? `${content.substring(0, 25)}...` : content);

    // Optimistically save user message
    await saveChatSession(userId, currentId, currentTitle, newMessages, activeChat?.agent);

    // Increment usage message count
    await incrementMessageCount(userId);

    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    const assistantMessageId = Math.random().toString(36).substring(2, 15);
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    // Add placeholder assistant message
    const messagesWithPlaceholder = [...newMessages, assistantMessage];
    
    // Update local state temporarily for snappy UI
    setChats(prevChats => {
      const idx = prevChats.findIndex(c => c.id === currentId);
      const updatedSession: ChatSession = {
        id: currentId,
        title: currentTitle,
        createdAt: idx >= 0 ? prevChats[idx].createdAt : Date.now(),
        updatedAt: Date.now(),
        messages: messagesWithPlaceholder
      };
      
      if (idx >= 0) {
        const copy = [...prevChats];
        copy[idx] = updatedSession;
        return copy.sort((a, b) => b.updatedAt - a.updatedAt);
      } else {
        return [updatedSession, ...prevChats];
      }
    });

    let streamedContent = "";

    try {
      await streamGroqCompletion(
        newMessages,
        (chunk) => {
          streamedContent += chunk;
          // Update the streaming content in state
          setChats(prevChats => 
            prevChats.map(c => {
              if (c.id === currentId) {
                return {
                  ...c,
                  messages: c.messages.map(m => 
                    m.id === assistantMessageId ? { ...m, content: streamedContent } : m
                  )
                };
              }
              return c;
            })
          );
        },
        controller.signal,
        activeChat?.agent
      );

      // Save complete session with streamed content to DB
      const finalAssistantMessage = { ...assistantMessage, content: streamedContent };
      const finalMessages = [...newMessages, finalAssistantMessage];
      await saveChatSession(userId, currentId, currentTitle, finalMessages, activeChat?.agent);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Streaming aborted");
      } else {
        console.error("Completion error:", err);
        // Show friendly error inside chat
        const errorAssistantMessage = { 
          ...assistantMessage, 
          content: "Sorry, I encountered an error communicating with the Groq API. Please check your network connection or API configuration." 
        };
        const finalMessages = [...newMessages, errorAssistantMessage];
        await saveChatSession(userId, currentId, currentTitle, finalMessages, activeChat?.agent);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleSelectAgent = async (agent: 'frontend' | 'backend' | 'fullstack' | 'general') => {
    const newId = Math.random().toString(36).substring(2, 15);
    setActiveChatId(newId);

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }

    let welcomeText = "";
    let title = "";

    if (agent === "frontend") {
      welcomeText = "Hello! I am your Frontend Developer Assistant. Ask me anything about React, CSS, Tailwind, TypeScript, modern UI design, animations, or browser performance.";
      title = "Frontend Assistant";
    } else if (agent === "backend") {
      welcomeText = "Hello! I am your Backend Developer Assistant. Ask me anything about APIs, databases (SQL/NoSQL), server architecture, authentication, or Docker/DevOps.";
      title = "Backend Assistant";
    } else if (agent === "fullstack") {
      welcomeText = "Hello! I am your Fullstack Developer Assistant. I can help you with end-to-end applications, deployments (Vercel, AWS), system architectures, or integrations.";
      title = "Fullstack Assistant";
    } else {
      welcomeText = "Hello! How can I help you code today?";
      title = "Developer Assistant";
    }

    const assistantMessage: Message = {
      id: Math.random().toString(36).substring(2, 15),
      role: "assistant",
      content: welcomeText,
      timestamp: Date.now(),
    };

    const session: ChatSession = {
      id: newId,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [assistantMessage],
      agent,
    };

    // Optimistically update the chats list locally
    setChats((prevChats) => [session, ...prevChats]);

    // Save session with agent data to DB
    await saveChatSession(userId, newId, title, [assistantMessage], agent);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="workspace-container">
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={toggleSidebar}></div>
      )}
      <Sidebar
        activeChatId={activeChatId}
        chats={chats}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        collapsed={!sidebarOpen}
        profile={profile}
        onOpenBilling={() => setIsBillingOpen(true)}
        activeAgent={activeChat?.agent || 'general'}
        onSelectAgent={handleSelectAgent}
      />

      <main className="workspace-content">
        <ChatArea
          chatTitle={chatTitle}
          messages={currentMessages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onToggleSidebar={toggleSidebar}
          onRegenerateMessage={handleRegenerateMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      </main>

      <SubscriptionModal
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
        userId={userId}
      />
    </div>
  );
};
