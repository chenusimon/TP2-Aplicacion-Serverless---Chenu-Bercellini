import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import type { Chat } from "@/backend/model";
import type { AppView } from "@/app/types";
import { Icon } from "./Icon";

type SidebarProps = {
  user: User;
  displayName: string;
  chats: Chat[];
  activeChatId: string | null;
  activeView: AppView;
  chatsLoading: boolean;
  chatsError: string;
  creatingChat: boolean;
  deletingChatId: string | null;
  renamingChatId: string | null;
  historyEnabled: boolean;
  onNewConversation: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chat: Chat) => void;
  onRenameChat: (chatId: string, title: string) => Promise<boolean>;
  onChangeView: (view: AppView) => void;
  onSignOut: () => void;
};

export function Sidebar({
  user,
  displayName,
  chats,
  activeChatId,
  activeView,
  chatsLoading,
  chatsError,
  creatingChat,
  deletingChatId,
  renamingChatId,
  historyEnabled,
  onNewConversation,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onChangeView,
  onSignOut,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-app-line bg-app-sidebar p-3 md:flex">
      <div className="flex h-12 items-center gap-3 px-2">
        <div className="grid size-8 place-items-center rounded-xl bg-app-foreground text-sm font-semibold text-app-background">A</div>
        <span className="font-semibold tracking-tight">Askly</span>
      </div>

      <button
        type="button"
        onClick={onNewConversation}
        disabled={creatingChat}
        className="mt-3 flex h-11 items-center gap-3 rounded-xl border border-app-line bg-app-surface px-3 text-sm font-medium shadow-sm hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon name="edit" />
        {creatingChat ? "Creating..." : "New conversation"}
      </button>

      <nav className="mt-7 min-h-0 flex-1 overflow-y-auto" aria-label="Chat history">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-app-subtle">Conversations</p>
        {historyEnabled && (
          <label className="mb-3 flex h-10 items-center gap-2 rounded-xl border border-app-line bg-app-surface px-3 text-app-muted focus-within:border-app-subtle focus-within:text-app-foreground">
            <span className="sr-only">Search chat history</span>
            <Icon name="search" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search chats"
              className="min-w-0 flex-1 bg-transparent text-sm text-app-foreground outline-none placeholder:text-app-subtle"
            />
          </label>
        )}
        <ChatList
          chats={chats}
          searchQuery={searchQuery}
          activeChatId={activeChatId}
          loading={chatsLoading}
          error={chatsError}
          historyEnabled={historyEnabled}
          deletingChatId={deletingChatId}
          renamingChatId={renamingChatId}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
          onRenameChat={onRenameChat}
        />
      </nav>

      <div className="space-y-1 border-t border-app-line pt-3">
        <NavigationButton
          label="Profile"
          icon="user"
          active={activeView === "profile"}
          onClick={() => onChangeView("profile")}
        />
        <NavigationButton
          label="Settings"
          icon="settings"
          active={activeView === "settings"}
          onClick={() => onChangeView("settings")}
        />
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-app-avatar text-app-avatar-text"><Icon name="user" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium capitalize">{displayName}</p>
            <p className="truncate text-xs text-app-muted">{user.email}</p>
          </div>
          <button type="button" onClick={onSignOut} className="rounded-lg px-2 py-1 text-xs font-medium text-app-muted hover:bg-app-hover hover:text-app-foreground">Log out</button>
        </div>
      </div>
    </aside>
  );
}

type ChatListProps = {
  chats: Chat[];
  searchQuery: string;
  activeChatId: string | null;
  loading: boolean;
  error: string;
  historyEnabled: boolean;
  deletingChatId: string | null;
  renamingChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chat: Chat) => void;
  onRenameChat: (chatId: string, title: string) => Promise<boolean>;
};

function ChatList({ chats, searchQuery, activeChatId, loading, error, historyEnabled, deletingChatId, renamingChatId, onSelectChat, onDeleteChat, onRenameChat }: ChatListProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  if (!historyEnabled) return <p className="px-3 py-2 text-sm text-app-muted">History is turned off</p>;
  if (loading) return <p className="px-3 py-2 text-sm text-app-muted">Loading chats...</p>;
  if (error) return <p className="px-3 py-2 text-sm text-app-danger">{error}</p>;
  if (chats.length === 0) return <p className="px-3 py-2 text-sm text-app-muted">No chats</p>;

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredChats = normalizedQuery
    ? chats.filter((chat) => (chat.title || "Untitled chat").toLocaleLowerCase().includes(normalizedQuery))
    : chats;

  if (filteredChats.length === 0) {
    return <p className="px-3 py-2 text-sm text-app-muted">No matching chats</p>;
  }

  const groupedChats = groupChatsByDate(filteredChats);

  function startEditing(chat: Chat) {
    setEditingChatId(chat.id);
    setDraftTitle(chat.title || "Untitled chat");
  }

  async function submitRename(event: FormEvent<HTMLFormElement>, chatId: string) {
    event.preventDefault();
    if (await onRenameChat(chatId, draftTitle)) setEditingChatId(null);
  }

  return (
    <div className="space-y-4">
      {groupedChats.map(({ label, chats: groupChats }) => (
        <section key={label} aria-labelledby={`chat-group-${label.toLowerCase()}`}>
          <h2 id={`chat-group-${label.toLowerCase()}`} className="px-3 pb-1 text-[11px] font-medium text-app-subtle">{label}</h2>
          <ul className="space-y-1">
            {groupChats.map((chat) => (
              <li key={chat.id} className="group relative">
                {editingChatId === chat.id ? (
                  <form onSubmit={(event) => void submitRename(event, chat.id)} className="flex min-h-12 items-center gap-1 rounded-xl border border-app-line bg-app-surface px-2">
                    <input
                      autoFocus
                      aria-label="Conversation title"
                      value={draftTitle}
                      maxLength={80}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Escape") setEditingChatId(null); }}
                      className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                    />
                    <button type="submit" aria-label="Save title" disabled={!draftTitle.trim() || renamingChatId === chat.id} className="grid size-7 place-items-center rounded-lg text-app-muted hover:bg-app-hover hover:text-app-foreground disabled:opacity-40 [&_svg]:size-4">
                      <Icon name="check" />
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectChat(chat.id)}
                      className={`flex w-full items-center gap-3 rounded-xl py-2 pl-3 pr-[4.5rem] text-left hover:bg-app-hover ${activeChatId === chat.id ? "bg-app-active font-medium" : "text-app-muted"}`}
                    >
                      <Icon name="chat" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{chat.title || "Untitled chat"}</span>
                        <span className="block text-[11px] font-normal text-app-subtle">{formatChatTimestamp(chat)}</span>
                      </span>
                    </button>
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                      <button type="button" aria-label={`Rename ${chat.title || "Untitled chat"}`} title="Rename conversation" onClick={() => startEditing(chat)} className="grid size-7 place-items-center rounded-lg text-app-subtle hover:bg-app-surface hover:text-app-foreground [&_svg]:size-4">
                        <Icon name="edit" />
                      </button>
                      <button type="button" aria-label={`Delete ${chat.title || "Untitled chat"}`} title="Delete conversation" disabled={deletingChatId === chat.id} onClick={() => onDeleteChat(chat)} className="grid size-7 place-items-center rounded-lg text-app-subtle hover:bg-app-surface hover:text-app-danger disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4">
                        <Icon name="trash" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function groupChatsByDate(chats: Chat[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = [
    { label: "Today", chats: [] as Chat[] },
    { label: "Yesterday", chats: [] as Chat[] },
    { label: "Older", chats: [] as Chat[] },
  ];

  for (const chat of chats) {
    const date = new Date(chat.updated_at || chat.created_at);
    if (date >= today) groups[0].chats.push(chat);
    else if (date >= yesterday) groups[1].chats.push(chat);
    else groups[2].chats.push(chat);
  }

  return groups.filter((group) => group.chats.length > 0);
}

function formatChatTimestamp(chat: Chat) {
  const date = new Date(chat.updated_at || chat.created_at);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return isToday
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

type NavigationButtonProps = {
  label: string;
  icon: "user" | "settings";
  active: boolean;
  onClick: () => void;
};

function NavigationButton({ label, icon, active, onClick }: NavigationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-app-hover ${active ? "bg-app-active font-medium text-app-foreground" : "text-app-muted"}`}
    >
      <Icon name={icon} />
      {label}
    </button>
  );
}
