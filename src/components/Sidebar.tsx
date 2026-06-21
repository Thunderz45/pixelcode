import React, { useState } from "react";
import {
  MessageSquare,
  Trash2,
  LogOut,
  Image as ImageIcon,
  ChevronsUpDown,
  SquarePen
} from "lucide-react";
import { auth } from "../firebase";
import type { ChatSession } from "../services/db";
import "./Sidebar.css";

interface SidebarProps {
  activeChatId: string | null;
  chats: ChatSession[];
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  collapsed?: boolean;
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
    if (!user) return "U";
    if (user.displayName) {
      const parts = user.displayName.split(" ");
      return parts.map((p) => p[0]).join("").substring(0, 2).toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : "U";
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

  const grouped = groupChats(chats);

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
        </div>
      </div>

      <div className="sidebar-content flex-grow-1 overflow-auto px-3">
        {/* Agents Section */}
        <div className="agents-section mb-4">
          <h2 className="chat-list-title">Agents</h2>
          
          <a
            href="https://pixel-ai-studio-liart.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-menu-item text-decoration-none"
            style={{ color: "inherit" }}
          >
            <div className="agent-icon-wrapper bg-info text-white">
              <ImageIcon size={12} />
            </div>
            <span>Image Creator</span>
          </a>
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
            <button className="dropdown-item d-flex align-items-center gap-2" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        )}
        <div className="profile-card" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          <div className="profile-avatar">
            {getInitials()}
          </div>
          <div className="profile-info">
            <div className="profile-email">
              {user?.displayName || user?.email?.split("@")[0] || "Developer"}
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
