import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { auth } from "../firebase";
import { type Message, streamGroqCompletion } from "../services/groq";
import { 
  type ChatSession, 
  saveChatSession, 
  subscribeToChats, 
  deleteChatSession 
} from "../services/db";
import "./ChatWorkspace.css";

export const ChatWorkspace: React.FC = () => {
  const user = auth.currentUser;
  const userId = user?.uid || "guest";

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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

    await saveChatSession(userId, activeChatId, activeChat.title, updatedMessages);
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

    await saveChatSession(userId, activeChatId, activeChat.title, messagesToKeep);
    await handleSendMessage(lastUserMessage.content);
  };

  const handleSendMessage = async (content: string) => {
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
    await saveChatSession(userId, currentId, currentTitle, newMessages);

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
        controller.signal
      );

      // Save complete session with streamed content to DB
      const finalAssistantMessage = { ...assistantMessage, content: streamedContent };
      const finalMessages = [...newMessages, finalAssistantMessage];
      await saveChatSession(userId, currentId, currentTitle, finalMessages);
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
        await saveChatSession(userId, currentId, currentTitle, finalMessages);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
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
    </div>
  );
};
