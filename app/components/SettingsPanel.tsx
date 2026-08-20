import type { User } from "@supabase/supabase-js";
import type { UserSettings } from "@/backend/model";
import { Icon } from "./Icon";

type SettingsPanelProps = {
  user: User;
  displayName: string;
  settings: UserSettings | null;
  loading: boolean;
  savingSetting: keyof Pick<UserSettings, "dark_mode" | "save_history"> | null;
  error: string;
  onSettingChange: (setting: "dark_mode" | "save_history", enabled: boolean) => void;
};

export function SettingsPanel({
  user,
  displayName,
  settings,
  loading,
  savingSetting,
  error,
  onSettingChange,
}: SettingsPanelProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9">
          <p className="text-sm font-medium text-app-muted">Preferences</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Settings</h1>
          <p className="mt-2 text-sm leading-6 text-app-muted">Customize how Askly looks and handles your conversations.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-app-line bg-app-surface px-6 py-8 text-sm text-app-muted shadow-sm">Loading settings...</div>
        ) : settings ? (
          <div className="overflow-hidden rounded-2xl border border-app-line bg-app-surface shadow-sm">
            <SettingRow
              title="Dark mode"
              description="Use a darker appearance for the interface."
              enabled={settings.dark_mode}
              saving={savingSetting === "dark_mode"}
              onChange={(enabled) => onSettingChange("dark_mode", enabled)}
            />
            <SettingRow
              title="Save chat history"
              description="Keep your conversations available in the sidebar."
              enabled={settings.save_history}
              saving={savingSetting === "save_history"}
              onChange={(enabled) => onSettingChange("save_history", enabled)}
            />
          </div>
        ) : null}

        {error && <p role="alert" className="mt-3 text-sm text-app-danger">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-2xl border border-app-line bg-app-surface shadow-sm">
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-sm font-semibold">Account</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-app-avatar text-app-avatar-text"><Icon name="user" /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium capitalize">{displayName}</p>
                <p className="truncate text-sm text-app-muted">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs text-app-subtle">Changes are saved automatically.</p>
      </div>
    </div>
  );
}

type SettingRowProps = {
  title: string;
  description: string;
  enabled: boolean;
  saving: boolean;
  onChange: (enabled: boolean) => void;
};

function SettingRow({ title, description, enabled, saving, onChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-app-line px-5 py-5 last:border-b-0 sm:px-6">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-app-muted">{description}</p>
      </div>
      <button type="button" onClick={() => onChange(!enabled)} disabled={saving} aria-label={`Toggle ${title.toLowerCase()}`} aria-pressed={enabled} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${enabled ? "bg-app-foreground" : "bg-app-active"}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-app-surface shadow-sm ${enabled ? "right-1" : "left-1"}`} />
      </button>
    </div>
  );
}
