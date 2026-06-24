import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { auth } from "../firebase";
import { type Message, streamGroqCompletion } from "../services/groq";
import { streamOpenRouterCompletion } from "../services/openrouter";
import { streamSahayakCompletion } from "../services/sahayak";
import { generateImageFromPrompt } from "../services/imageService";
import { 
  type ChatSession, 
  saveChatSession, 
  subscribeToChats, 
  deleteChatSession,
  type UserProfile,
  subscribeToUserProfile,
  type Project,
  saveProject,
  subscribeToProjects,
  deleteProject,
  setActiveProjectInProfile
} from "../services/db";
import { SettingsModal } from "./SettingsModal";
import { InfoModal } from "./InfoModal";
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
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // New enhancements states
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const currentUid = auth.currentUser?.uid || "guest";
      const data = localStorage.getItem(`pixelcode_projects_${currentUid}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const currentUid = auth.currentUser?.uid || "guest";
      return localStorage.getItem(`pixelcode_active_project_id_${currentUid}`);
    } catch {
      return null;
    }
  });
  const [selectedModel, setSelectedModel] = useState<'pro' | 'high' | 'low'>('pro');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalMode, setInfoModalMode] = useState<'tools' | 'workflow' | 'project' | 'preferences' | 'theme' | 'language' | 'shortcuts' | 'report' | 'workspace' | null>(null);

  // Sync state when userId changes to prevent bleed and load correct local fallback
  useEffect(() => {
    setChats([]);
    setActiveChatId(null);
    setProfile(null);
    setFirestoreError(null);
    try {
      const data = localStorage.getItem(`pixelcode_projects_${userId}`);
      setProjects(data ? JSON.parse(data) : []);
      setActiveProjectId(localStorage.getItem(`pixelcode_active_project_id_${userId}`));
    } catch {
      setProjects([]);
      setActiveProjectId(null);
    }
    setSelectedModel('pro');
    setSettingsOpen(false);
    setInfoModalOpen(false);
    setInfoModalMode(null);
  }, [userId]);

  // Subscribe to user usage and subscription profile details
  useEffect(() => {
    const unsubscribe = subscribeToUserProfile(
      userId,
      (updatedProfile) => {
        setProfile(updatedProfile);
        
        // Sync active project from other devices if available
        setActiveProjectId((prev) => {
          // Don't sync if local state is already matching
          if (prev !== updatedProfile.activeProjectId) {
            try {
              if (updatedProfile.activeProjectId) {
                localStorage.setItem(`pixelcode_active_project_id_${userId}`, updatedProfile.activeProjectId);
              } else {
                localStorage.removeItem(`pixelcode_active_project_id_${userId}`);
              }
            } catch (e) {}
            return updatedProfile.activeProjectId || null;
          }
          return prev;
        });
      },
      (err) => {
        if (err.message.includes("permission") || err.message.includes("PERMISSION_DENIED")) {
          setFirestoreError("Firestore permission error: Please copy the config from firestore.rules and apply it in Firebase Console.");
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Subscribe to real-time chats from database
  useEffect(() => {
    const unsubscribe = subscribeToChats(
      userId,
      (updatedChats) => {
        setChats(updatedChats);
        
        // Auto-select the most recent chat if none is active and chats exist
        if (updatedChats.length > 0 && !activeChatId) {
          setActiveChatId(updatedChats[0].id);
        }
      },
      (err) => {
        if (err.message.includes("permission") || err.message.includes("PERMISSION_DENIED")) {
          setFirestoreError("Firestore permission error: Please copy the config from firestore.rules and apply it in Firebase Console.");
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Subscribe to real-time projects from database
  useEffect(() => {
    const unsubscribe = subscribeToProjects(
      userId,
      (updatedProjects) => {
        setProjects(updatedProjects);
      },
      (err) => {
        if (err.message.includes("permission") || err.message.includes("PERMISSION_DENIED")) {
          setFirestoreError("Firestore permission error: Please copy the config from firestore.rules and apply it in Firebase Console.");
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [userId]);

  const handleSelectProject = (projectId: string | null) => {
    setActiveProjectId(projectId);
    try {
      if (projectId) {
        localStorage.setItem(`pixelcode_active_project_id_${userId}`, projectId);
      } else {
        localStorage.removeItem(`pixelcode_active_project_id_${userId}`);
      }
    } catch (e) {
      console.error("Failed to save active project id:", e);
    }
    
    // Sync to profile for cross-device roaming
    setActiveProjectInProfile(userId, projectId);

    const projectChats = projectId 
      ? chats.filter((c) => c.projectId === projectId)
      : chats;

    if (projectChats.length > 0) {
      setActiveChatId(projectChats[0].id);
    } else {
      setActiveChatId(null);
    }
  };

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

    await saveChatSession(userId, activeChatId, activeChat.title, updatedMessages, activeChat.agent, activeChat.projectId);
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

    await saveChatSession(userId, activeChatId, activeChat.title, messagesToKeep, activeChat.agent, activeChat.projectId);
    await handleSendMessage(lastUserMessage.content);
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
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
    const targetProjectId = activeChat?.projectId || activeProjectId || undefined;
    try {
      await saveChatSession(userId, currentId, currentTitle, newMessages, activeChat?.agent, targetProjectId);
    } catch (err) {
      console.error("Failed to save optimistic chat session to Firestore:", err);
    }

    // No credits system active: message count / credit decrement logic removed

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
        messages: messagesWithPlaceholder,
        agent: activeChat?.agent || 'general',
        projectId: targetProjectId,
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
      if (activeChat?.agent === "designtocode") {
        await streamOpenRouterCompletion(
          newMessages,
          (chunk) => {
            streamedContent += chunk;
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
      } else if (activeChat?.agent === "sahayak") {
        await streamSahayakCompletion(
          newMessages,
          (chunk) => {
            streamedContent += chunk;
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
      } else {
        await streamGroqCompletion(
          newMessages,
          (chunk) => {
            streamedContent += chunk;
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
          activeChat?.agent,
          selectedModel
        );
      }

      if (activeChat?.agent === "uiux") {
        // Step 2: Append loading message and generate image using the generated prompt
        const loadingContent = streamedContent + "\n\n[UI_GENERATION_IN_PROGRESS]";
        setChats(prevChats => 
          prevChats.map(c => {
            if (c.id === currentId) {
              return {
                ...c,
                messages: c.messages.map(m => 
                  m.id === assistantMessageId ? { ...m, content: loadingContent } : m
                )
              };
            }
            return c;
          })
        );
        
        const imageUrl = await generateImageFromPrompt(streamedContent);
        streamedContent = streamedContent + `\n\n![Generated UI Design](${imageUrl})`;
        
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
      }

      // Save complete session with streamed content to DB
      const finalAssistantMessage = { ...assistantMessage, content: streamedContent };
      const finalMessages = [...newMessages, finalAssistantMessage];
      await saveChatSession(userId, currentId, currentTitle, finalMessages, activeChat?.agent, targetProjectId);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Streaming aborted");
      } else {
        console.error("Completion error:", err);
        const errorAssistantMessage = { 
          ...assistantMessage, 
          content: `Sorry, I encountered an error: ${err.message || "Please check your network connection or API configuration."}` 
        };
        const finalMessages = [...newMessages, errorAssistantMessage];
        await saveChatSession(userId, currentId, currentTitle, finalMessages, activeChat?.agent, targetProjectId);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleSelectAgent = async (agent: 'fullstack' | 'uiux' | 'designtocode' | 'sahayak' | 'general') => {
    const newId = Math.random().toString(36).substring(2, 15);
    setActiveChatId(newId);

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }

    let welcomeText = "";
    let title = "";

    if (agent === "designtocode") {
      welcomeText = "Hello! I am your Design-to-Code Assistant. Upload any UI mockup, screenshot, or sketch, and I will convert it into clean, responsive frontend code for you!";
      title = "Design-to-Code";
    } else if (agent === "fullstack") {
      welcomeText = "Hello! I am your Fullstack Developer Assistant. I can help you with end-to-end applications, deployments (Vercel, AWS), system architectures, or integrations.";
      title = "Fullstack Assistant";
    } else if (agent === "uiux") {
      welcomeText = "Hello! I am your UI/UX Designer Assistant. I can help you refine UI design prompts and conceptualize beautiful user interfaces.";
      title = "UI/UX Designer";
    } else if (agent === "sahayak") {
      welcomeText = "Namaste! 🙏 I'm Sahayak — your coding companion and development helper. Whether you need help writing code, debugging issues, planning architecture, or just want to chat about development — I'm here for you! What are you working on today?";
      title = "Sahayak Assistant";
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
      projectId: activeProjectId || undefined,
    };

    // Optimistically update the chats list locally
    setChats((prevChats) => [session, ...prevChats]);

    // Save session with agent data to DB
    await saveChatSession(userId, newId, title, [assistantMessage], agent, activeProjectId || undefined);
  };

  const handleCreateProject = async (name: string) => {
    const projId = Math.random().toString(36).substring(2, 15);
    const newProj: Project = {
      id: projId,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    // Optimistically update projects state instantly
    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(projId);
    try {
      localStorage.setItem(`pixelcode_active_project_id_${userId}`, projId);
    } catch (e) {
      console.error("Failed to save active project id:", e);
    }
    setActiveProjectInProfile(userId, projId);
    setActiveChatId(null);
    await saveProject(userId, projId, name);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project and all its chats?")) {
      // Optimistically update projects state instantly
      setProjects(prev => prev.filter(p => p.id !== id));
      const chatsToDelete = chats.filter((c) => c.projectId === id);
      for (const chat of chatsToDelete) {
        await deleteChatSession(userId, chat.id);
      }
      if (activeProjectId === id) {
        handleSelectProject(null);
      }
      await deleteProject(userId, id);
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
        profile={profile}
        activeAgent={activeChat?.agent || 'general'}
        onSelectAgent={handleSelectAgent}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenInfoModal={(mode) => {
          setInfoModalMode(mode);
          setInfoModalOpen(true);
        }}
      />

      <main className="workspace-content" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {firestoreError && (
          <div 
            className="firestore-error-banner"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              borderBottom: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              padding: "10px 20px",
              fontSize: "0.85rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 10,
              backdropFilter: "blur(8px)"
            }}
          >
            <span>⚠️ <strong>Database Sync Issue:</strong> {firestoreError}</span>
            <button 
              onClick={() => setFirestoreError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
                opacity: 0.8
              }}
            >
              ✕
            </button>
          </div>
        )}
        <ChatArea
          chatTitle={chatTitle}
          messages={currentMessages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          onToggleSidebar={toggleSidebar}
          onRegenerateMessage={handleRegenerateMessage}
          onDeleteMessage={handleDeleteMessage}
          projectName={projects.find((p) => p.id === activeProjectId)?.name || null}
          onOpenSettings={() => setSettingsOpen(true)}
          selectedModel={selectedModel}
          onChangeModel={setSelectedModel}
          activeAgent={activeChat?.agent || 'general'}
        />
      </main>

      {/* SubscriptionModal removed */}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userId={userId}
        profile={profile}
      />

      <InfoModal
        isOpen={infoModalOpen}
        mode={infoModalMode}
        onClose={() => {
          setInfoModalOpen(false);
          setInfoModalMode(null);
        }}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};
