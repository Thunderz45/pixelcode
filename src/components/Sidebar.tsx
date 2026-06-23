import React, { useState } from "react";
import {
  MessageSquare,
  Trash2,
  LogOut,
  Folder,
  SlidersHorizontal,
  Share2,
  Image as ImageIcon,
  ChevronsUpDown,
  SquarePen,
  Palette,
  Globe,
  Command,
  Mail,
  Settings,
  Briefcase,
  ChevronRight,
  Code,
  Layers,
  Plus
} from "lucide-react";
import { auth } from "../firebase";
import type { ChatSession, UserProfile, Project } from "../services/db";
import "./Sidebar.css";

interface SidebarProps {
  activeChatId: string | null;
  chats: ChatSession[];
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  collapsed?: boolean;
  profile: UserProfile | null;
  activeAgent: 'fullstack' | 'uiux' | 'designtocode' | 'general';
  onSelectAgent: (agent: 'fullstack' | 'uiux' | 'designtocode' | 'general') => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onDeleteProject: (projectId: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenInfoModal: (mode: 'tools' | 'workflow' | 'project' | 'preferences' | 'theme' | 'language' | 'shortcuts' | 'report' | 'workspace') => void;
}

interface GroupedChats {
  [key: string]: ChatSession[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeChatId,
  chats,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  collapsed = false,
  profile,
  activeAgent = 'general',
  onSelectAgent,
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onOpenSettings,
  onOpenInfoModal,
}) => {
  const user = auth.currentUser;
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const getInitials = () => {
    if (profile?.username) {
      const parts = profile.username.trim().split(" ");
      return parts.map((p) => p[0]).join("").substring(0, 2).toUpperCase();
    }
    if (!user) return "U";
    if (user.displayName) {
      const parts = user.displayName.split(" ");
      return parts.map((p) => p[0]).join("").substring(0, 2).toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : "U";
  };

  const getUserName = () => {
    if (profile?.username) return profile.username;
    if (!user) return "Developer";
    return user.displayName || user.email?.split("@")[0] || "Developer";
  };

  const groupChats = (chatList: ChatSession[]): GroupedChats => {
    const groups: GroupedChats = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    chatList.forEach((chat) => {
      const time = chat.updatedAt || chat.createdAt || Date.now();
      if (time >= todayStart) {
        groups.Today.push(chat);
      } else if (time >= yesterdayStart) {
        groups.Yesterday.push(chat);
      } else if (time >= sevenDaysAgoStart) {
        groups["Previous 7 Days"].push(chat);
      } else {
        groups.Older.push(chat);
      }
    });

    return groups;
  };

  const filteredChats = activeProjectId 
    ? chats.filter((c) => c.projectId === activeProjectId)
    : chats;

  const grouped = groupChats(filteredChats);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : "open"} d-flex flex-column h-100`}>
      <div className="sidebar-header d-flex flex-column p-3 pb-2">
        <div className="sidebar-logo text-white px-1 mb-3">
          pixelcode
        </div>
        
        {/* Main Navigation Actions */}
        <div className="sidebar-static-menu mb-2">
          <div className="sidebar-menu-item" onClick={onNewChat}>
            <SquarePen size={18} />
            <span>New Chat</span>
          </div>
          <div className="sidebar-menu-item" onClick={() => onOpenInfoModal('tools')}>
            <SlidersHorizontal size={18} />
            <span>Tool Management</span>
          </div>
          <div className="sidebar-menu-item" onClick={() => onOpenInfoModal('workflow')}>
            <Share2 size={18} />
            <span>Workflow</span>
          </div>
        </div>
      </div>

      <div className="sidebar-content flex-grow-1 overflow-auto px-3">
        {/* Agents Section */}
        <div className="agents-section mb-4">
          <h2 className="chat-list-title">Agents</h2>
          
          <div 
            className={`sidebar-menu-item ${activeAgent === "designtocode" ? "active" : ""}`}
            onClick={() => onSelectAgent("designtocode")}
          >
            <div className="agent-icon-wrapper bg-primary text-white">
              <Code size={12} />
            </div>
            <span>Design-to-Code</span>
          </div>
          
          <div 
            className={`sidebar-menu-item ${activeAgent === "fullstack" ? "active" : ""}`}
            onClick={() => onSelectAgent("fullstack")}
          >
            <div className="agent-icon-wrapper bg-warning text-white">
              <Layers size={12} />
            </div>
            <span>Fullstack Agent</span>
          </div>

          <div 
            className={`sidebar-menu-item ${activeAgent === "uiux" ? "active" : ""}`}
            onClick={() => onSelectAgent("uiux")}
          >
            <div className="agent-icon-wrapper bg-info text-white">
              <ImageIcon size={12} />
            </div>
            <span>UI/UX Designer</span>
          </div>
        </div>

        {/* Projects Section */}
        <div className="projects-section mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h2 className="chat-list-title mb-0">Projects</h2>
            <button 
              className="btn btn-link p-0 text-secondary d-flex align-items-center"
              style={{ border: "none", background: "none", color: "var(--text-secondary)" }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenInfoModal('project');
              }}
              title="Create New Project"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div 
            className={`sidebar-menu-item ${!activeProjectId ? "active" : ""}`}
            onClick={() => onSelectProject(null)}
          >
            <div className="agent-icon-wrapper bg-secondary text-white">
              <Folder size={12} />
            </div>
            <span>General / All</span>
          </div>

          {projects.map((proj) => (
            <div 
              key={proj.id}
              className={`sidebar-menu-item justify-content-between ${activeProjectId === proj.id ? "active" : ""}`}
              onClick={() => onSelectProject(proj.id)}
            >
              <div className="d-flex align-items-center gap-2 text-truncate">
                <div className="agent-icon-wrapper bg-primary text-white">
                  <Folder size={12} />
                </div>
                <span className="text-truncate">{proj.name}</span>
              </div>
              <button 
                className="delete-chat-btn btn p-0 ms-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(proj.id, e);
                }}
                style={{ border: "none", background: "none", opacity: 0.7 }}
                title="Delete Project"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Dynamic Chat Conversations grouped by date */}
        <div className="conversations-section">
          {Object.entries(grouped).map(([groupName, groupChats]) => {
            if (groupChats.length === 0) return null;
            return (
              <div key={groupName} className="mb-3">
                <h2 className="chat-list-title">{groupName}</h2>
                {groupChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-item d-flex align-items-center justify-content-between p-2 rounded-2 ${
                      activeChatId === chat.id ? "active" : ""
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <div className="chat-item-info d-flex align-items-center gap-2 overflow-hidden">
                      <MessageSquare size={16} className="flex-shrink-0" />
                      <span className="chat-item-text text-truncate">{chat.title || "Untitled Chat"}</span>
                    </div>
                    <button
                      className="delete-chat-btn btn p-1 d-flex align-items-center justify-content-center"
                      onClick={(e) => onDeleteChat(chat.id, e)}
                      title="Delete Conversation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Card Footer block */}
      <div className="sidebar-footer p-3 position-relative">
        {showProfileMenu && (
          <div className="profile-dropdown-menu">
            {/* Popover Header */}
            <div className="dropdown-profile-header d-flex align-items-center p-3">
              <div className="dropdown-profile-avatar me-3">
                {getInitials()}
              </div>
              <div className="dropdown-profile-details overflow-hidden">
                <div className="dropdown-profile-name fw-bold text-white text-uppercase text-truncate">
                  {getUserName()}
                </div>
                <div className="dropdown-profile-email text-muted small text-truncate">
                  {profile?.email || user?.email || "anon@developer.com"}
                </div>
              </div>
            </div>
            
            <div className="dropdown-menu-list p-1">
              <button 
                className="dropdown-item d-flex align-items-center justify-content-between"
                onClick={() => {
                  onOpenInfoModal('preferences');
                  setShowProfileMenu(false);
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <SlidersHorizontal size={16} />
                  <span>Chat Preferences</span>
                </div>
              </button>
              
              <button 
                className="dropdown-item d-flex align-items-center justify-content-between"
                onClick={() => {
                  onOpenInfoModal('theme');
                  setShowProfileMenu(false);
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <Palette size={16} />
                  <span>Theme</span>
                </div>
                <div className="d-flex align-items-center gap-1 text-muted small">
                  <span>Dark Default</span>
                  <ChevronRight size={14} />
                </div>
              </button>
              
              <button 
                className="dropdown-item d-flex align-items-center justify-content-between"
                onClick={() => {
                  onOpenInfoModal('language');
                  setShowProfileMenu(false);
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <Globe size={16} />
                  <span>Language</span>
                </div>
                <ChevronRight size={14} className="text-muted" />
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item d-flex align-items-center gap-3"
                onClick={() => {
                  onOpenInfoModal('shortcuts');
                  setShowProfileMenu(false);
                }}
              >
                <Command size={16} />
                <span>Keyboard Shortcuts</span>
              </button>
              
              <button 
                className="dropdown-item d-flex align-items-center gap-3"
                onClick={() => {
                  onOpenInfoModal('report');
                  setShowProfileMenu(false);
                }}
              >
                <Mail size={16} />
                <span>Report an issue</span>
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item d-flex align-items-center gap-3"
                onClick={() => {
                  onOpenSettings();
                  setShowProfileMenu(false);
                }}
              >
                <Settings size={16} />
                <span>User Settings</span>
              </button>
              
              <button 
                className="dropdown-item d-flex align-items-center gap-3"
                onClick={() => {
                  onOpenInfoModal('workspace');
                  setShowProfileMenu(false);
                }}
              >
                <Briefcase size={16} />
                <span>{getUserName()}'s Workspace</span>
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item d-flex align-items-center gap-3 text-danger" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="profile-card" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <div className="profile-avatar">
            {getInitials()}
          </div>
          <div className="profile-info d-flex align-items-center overflow-hidden">
            <div className="profile-email text-truncate flex-grow-1" style={{ marginRight: "6px" }}>
              {profile?.email || user?.email || "anon@developer.com"}
            </div>
          </div>
          <div className="profile-arrow">
            <ChevronsUpDown size={16} />
          </div>
        </div>
      </div>
    </aside>
  );
};
