"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

const chats = ["Planning a weekend trip", "Explain serverless apps", "Study notes for databases", "Ideas for a portfolio", "Help with TypeScript"];

function Icon({ name }: { name: "chat" | "edit" | "settings" | "user" | "send" | "menu" }) {
  const paths = {
    chat: <path d="M7 8h10M7 12h7m7 0a9 9 0 1 1-4.12-7.56A9 9 0 0 1 21 12Z" />,
    edit: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />,
    settings: <><circle cx="12" cy="12" r="3.5" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1A8 8 0 0 0 15 6l-.4-2.6h-4L10 6a8 8 0 0 0-1.4 1L6 6 4 9.4 6.1 11a7 7 0 0 0 0 2L4 14.6 6 18l2.6-1a8 8 0 0 0 1.4 1l.5 2.6h4L15 18a8 8 0 0 0 1.4-1l2.5 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    send: <path d="m22 2-7 20-4-9-9-4 20-7Zm-11 11 4-4" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">{paths[name]}</svg>;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      setUser(data.session?.user ?? null);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.replace("/login");
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
    router.replace("/login");
  }

  if (checkingSession || !user) {
    return <main className="grid min-h-dvh place-items-center bg-[#f8f8f6] text-sm text-black/45">Loading Askly...</main>;
  }

  const displayName = user.email?.split("@")[0] ?? "Student";

  return (
    <main className="flex h-dvh overflow-hidden bg-[#f8f8f6] text-[#20201f]">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-black/8 bg-[#efefec] p-3 md:flex">
        <div className="flex h-12 items-center gap-3 px-2"><div className="grid size-8 place-items-center rounded-xl bg-[#20201f] text-sm font-semibold text-white">A</div><span className="font-semibold tracking-tight">Askly</span></div>
        <button type="button" className="mt-3 flex h-11 items-center gap-3 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium shadow-sm hover:bg-[#fafaf8]"><Icon name="edit" /> New conversation</button>
        <nav className="mt-7 min-h-0 flex-1 overflow-y-auto" aria-label="Chat history">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">Recent</p>
          <ul className="space-y-1">{chats.map((chat, index) => <li key={chat}><button type="button" className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-black/5 ${index === 0 ? "bg-black/[0.055] font-medium" : "text-black/65"}`}><Icon name="chat" /><span className="truncate">{chat}</span></button></li>)}</ul>
        </nav>
        <div className="space-y-1 border-t border-black/8 pt-3">
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black/65 hover:bg-black/5"><Icon name="settings" /> Settings</button>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"><div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#d9ddd2] text-[#3b4434]"><Icon name="user" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium capitalize">{displayName}</p><p className="truncate text-xs text-black/45">{user.email}</p></div><button type="button" onClick={handleSignOut} className="rounded-lg px-2 py-1 text-xs font-medium text-black/50 hover:bg-black/5 hover:text-black">Log out</button></div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/6 px-4 md:px-6">
          <button type="button" aria-label="Open menu" className="grid size-10 place-items-center rounded-xl hover:bg-black/5 md:hidden"><Icon name="menu" /></button>
          <button type="button" className="rounded-lg px-2 py-1 text-sm font-medium text-black/65 hover:bg-black/5">Askly <span className="text-black/35">▾</span></button>
          <button type="button" className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-black/[0.02]">Share</button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-12 sm:px-8">
            <div className="mb-10 text-center"><div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-[#20201f] text-lg font-semibold text-white shadow-lg shadow-black/10">A</div><h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">What can I help you with?</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">Start a new conversation, ask a question, or continue one of your recent chats.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{["Explain a difficult topic", "Help me brainstorm ideas", "Review some code", "Create a study plan"].map((prompt) => <button key={prompt} type="button" className="rounded-2xl border border-black/8 bg-white p-4 text-left text-sm text-black/65 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/15 hover:text-black">{prompt}</button>)}</div>
          </div>
          <div className="sticky bottom-0 bg-gradient-to-t from-[#f8f8f6] via-[#f8f8f6] to-transparent px-4 pb-4 pt-8 sm:px-8 sm:pb-6">
            <div className="mx-auto max-w-3xl"><div className="flex min-h-16 items-end gap-3 rounded-[22px] border border-black/10 bg-white p-2 pl-5 shadow-[0_8px_30px_rgba(0,0,0,0.07)]"><textarea aria-label="Message" placeholder="Message Askly" rows={1} className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-3 text-[15px] leading-5 outline-none placeholder:text-black/35" /><button type="button" aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#20201f] text-white hover:scale-[1.03]"><Icon name="send" /></button></div><p className="mt-2 text-center text-[11px] text-black/35">Askly can make mistakes. Check important information.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
