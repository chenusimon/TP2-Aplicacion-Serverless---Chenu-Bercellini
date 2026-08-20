import type { AppView } from "@/app/types";
import { Icon } from "./Icon";

const viewTitles: Record<AppView, string> = {
  conversation: "Askly",
  preferences: "AI Preferences",
  settings: "Settings",
  profile: "Profile",
};

type AppHeaderProps = {
  activeView: AppView;
  onShowConversation: () => void;
};

export function AppHeader({ activeView, onShowConversation }: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-app-line px-4 md:px-6">
      <button type="button" aria-label="Open menu" className="grid size-10 place-items-center rounded-xl hover:bg-app-hover md:hidden">
        <Icon name="menu" />
      </button>
      <button type="button" onClick={onShowConversation} className="rounded-lg px-2 py-1 text-sm font-medium text-app-muted hover:bg-app-hover">
        {viewTitles[activeView]} {activeView === "conversation" && <span className="text-app-subtle">▾</span>}
      </button>
      {activeView === "conversation" ? (
        <button type="button" className="rounded-lg border border-app-line bg-app-surface px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-app-hover">Share</button>
      ) : (
        <div className="w-16" aria-hidden="true" />
      )}
    </header>
  );
}
