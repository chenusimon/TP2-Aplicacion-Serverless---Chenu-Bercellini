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
  historyEnabled: boolean;
  onNewConversation: () => void;
  onSelectChat: (chatId: string) => void;
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
  historyEnabled,
  onNewConversation,
  onSelectChat,
  onChangeView,
  onSignOut,
}: SidebarProps) {
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
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-app-subtle">Recent</p>
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          loading={chatsLoading}
          error={chatsError}
          historyEnabled={historyEnabled}
          onSelectChat={onSelectChat}
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
  activeChatId: string | null;
  loading: boolean;
  error: string;
  historyEnabled: boolean;
  onSelectChat: (chatId: string) => void;
};

function ChatList({ chats, activeChatId, loading, error, historyEnabled, onSelectChat }: ChatListProps) {
  if (!historyEnabled) return <p className="px-3 py-2 text-sm text-app-muted">History is turned off</p>;
  if (loading) return <p className="px-3 py-2 text-sm text-app-muted">Loading chats...</p>;
  if (error) return <p className="px-3 py-2 text-sm text-app-danger">{error}</p>;
  if (chats.length === 0) return <p className="px-3 py-2 text-sm text-app-muted">No chats</p>;

  return (
    <ul className="space-y-1">
      {chats.map((chat) => (
        <li key={chat.id}>
          <button
            type="button"
            onClick={() => onSelectChat(chat.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-app-hover ${activeChatId === chat.id ? "bg-app-active font-medium" : "text-app-muted"}`}
          >
            <Icon name="chat" />
            <span className="truncate">{chat.title || "Untitled chat"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
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
