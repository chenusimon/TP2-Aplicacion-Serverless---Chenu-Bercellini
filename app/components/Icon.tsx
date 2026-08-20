import type { ReactNode } from "react";

export type IconName =
  | "chat"
  | "edit"
  | "settings"
  | "user"
  | "send"
  | "menu";

const iconPaths: Record<IconName, ReactNode> = {
  chat: <path d="M7 8h10M7 12h7m7 0a9 9 0 1 1-4.12-7.56A9 9 0 0 1 21 12Z" />,
  edit: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1A8 8 0 0 0 15 6l-.4-2.6h-4L10 6a8 8 0 0 0-1.4 1L6 6 4 9.4 6.1 11a7 7 0 0 0 0 2L4 14.6 6 18l2.6-1a8 8 0 0 0 1.4 1l.5 2.6h4L15 18a8 8 0 0 0 1.4-1l2.5 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  send: <path d="m22 2-7 20-4-9-9-4 20-7Zm-11 11 4-4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      {iconPaths[name]}
    </svg>
  );
}
