import type { User } from "@supabase/supabase-js";
import { Icon } from "./Icon";

type SettingsPanelProps = {
  user: User;
  displayName: string;
};

export function SettingsPanel({ user, displayName }: SettingsPanelProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9">
          <p className="text-sm font-medium text-black/45">Preferences</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Settings</h1>
          <p className="mt-2 text-sm leading-6 text-black/50">Customize how Askly looks and handles your conversations.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
          <SettingRow title="Dark mode" description="Use a darker appearance for the interface." enabled={false} />
          <SettingRow title="Save chat history" description="Keep your conversations available in the sidebar." enabled />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-sm font-semibold">Account</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#d9ddd2] text-[#3b4434]"><Icon name="user" /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium capitalize">{displayName}</p>
                <p className="truncate text-sm text-black/45">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs text-black/35">These controls are visual placeholders for now.</p>
      </div>
    </div>
  );
}

type SettingRowProps = {
  title: string;
  description: string;
  enabled: boolean;
};

function SettingRow({ title, description, enabled }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-black/8 px-5 py-5 last:border-b-0 sm:px-6">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-black/45">{description}</p>
      </div>
      <button type="button" aria-label={`Toggle ${title.toLowerCase()}`} aria-pressed={enabled} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? "bg-[#20201f]" : "bg-black/15"}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm ${enabled ? "right-1" : "left-1"}`} />
      </button>
    </div>
  );
}
