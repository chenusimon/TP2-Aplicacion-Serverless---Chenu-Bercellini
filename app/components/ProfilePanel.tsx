import type { User } from "@supabase/supabase-js";
import { Icon } from "./Icon";

type ProfilePanelProps = {
  user: User;
  displayName: string;
};

export function ProfilePanel({ user, displayName }: ProfilePanelProps) {
  const details = [
    { label: "Email address", value: user.email, className: "break-all text-sm font-medium" },
    { label: "Account created", value: formatAccountDate(user.created_at), className: "text-sm font-medium" },
    { label: "Last sign in", value: formatAccountDate(user.last_sign_in_at), className: "text-sm font-medium" },
    { label: "Sign-in method", value: user.app_metadata.provider ?? "Email", className: "text-sm font-medium capitalize" },
    { label: "User ID", value: user.id, className: "break-all font-mono text-xs text-black/65" },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9">
          <p className="text-sm font-medium text-black/45">Your account</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Profile</h1>
          <p className="mt-2 text-sm leading-6 text-black/50">View the information connected to your Askly account.</p>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4 border-b border-black/8 pb-6">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#d9ddd2] text-[#3b4434]"><Icon name="user" /></div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold capitalize">{displayName}</h2>
              <p className="mt-1 truncate text-sm text-black/45">{user.email}</p>
            </div>
          </div>

          <dl className="divide-y divide-black/8">
            {details.map((detail) => (
              <div key={detail.label} className="grid gap-1 py-5 last:pb-0 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="text-sm text-black/45">{detail.label}</dt>
                <dd className={detail.className}>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function formatAccountDate(value?: string) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
