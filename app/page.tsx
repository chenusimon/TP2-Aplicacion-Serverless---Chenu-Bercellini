"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Chat, Message, MessageRole } from "@/backend/model";

async function fetchChats(accessToken: string): Promise<Chat[]> {
  const response = await fetch("/api/chats", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = (await response.json()) as { data?: Chat[]; error?: string };

  if (!response.ok) {
    throw new Error(result.error ?? "Could not load chats.");
  }

  return result.data ?? [];
}

async function createChat(accessToken: string): Promise<Chat> {
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: null }),
  });
  const result = (await response.json()) as { data?: Chat; error?: string };

  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "Could not create a new chat.");
  }

  return result.data;
}

async function fetchMessages(chatId: string, accessToken: string): Promise<Message[]> {
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = (await response.json()) as { data?: Message[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? "Could not load messages.");
  return (result.data ?? []).sort((a, b) => a.position - b.position);
}

async function saveMessage(
  chatId: string,
  accessToken: string,
  role: MessageRole,
  content: string,
  position: number,
): Promise<Message> {
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role, content, position }),
  });
  const result = (await response.json()) as { data?: Message; error?: string };
  if (!response.ok || !result.data) throw new Error(result.error ?? "Could not save message.");
  return result.data;
}

async function askAI(prompt: string): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const result = (await response.json()) as { response?: string; error?: string };
  if (!response.ok || !result.response) throw new Error(result.error ?? "The AI could not answer.");
  return result.response;
}

async function updateChatTitle(chatId: string, accessToken: string, title: string) {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error("Could not update the chat title.");
}

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

function formatAccountDate(value?: string) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Home() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"conversation" | "settings" | "profile">("conversation");
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      setUser(data.session?.user ?? null);
      setCheckingSession(false);

      if (data.session) {
        fetchChats(data.session.access_token)
          .then(setChats)
          .catch((error: unknown) => {
            setChatsError(error instanceof Error ? error.message : "Could not load chats.");
          })
          .finally(() => setChatsLoading(false));
      } else {
        setChatsLoading(false);
      }
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

  async function handleNewConversation() {
    setActiveView("conversation");
    setCreatingChat(true);
    setChatsError("");

    try {
      const { data } = await getSupabaseClient().auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }

      const newChat = await createChat(data.session.access_token);
      setChats((currentChats) => [
        newChat,
        ...currentChats.filter((chat) => chat.id !== newChat.id),
      ]);
      setActiveChatId(newChat.id);
      setMessages([]);
      setMessageError("");
    } catch (error) {
      setChatsError(error instanceof Error ? error.message : "Could not create a new chat.");
    } finally {
      setCreatingChat(false);
    }
  }

  async function handleSelectChat(chatId: string) {
    setActiveView("conversation");
    setActiveChatId(chatId);
    setMessagesLoading(true);
    setMessageError("");

    try {
      const { data } = await getSupabaseClient().auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setMessages(await fetchMessages(chatId, data.session.access_token));
    } catch (error) {
      setMessages([]);
      setMessageError(error instanceof Error ? error.message : "Could not load messages.");
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || sending) return;

    setSending(true);
    setMessageError("");
    setPrompt("");

    try {
      const { data } = await getSupabaseClient().auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }

      const accessToken = data.session.access_token;
      let chatId = activeChatId;
      let activeChat = chats.find((chat) => chat.id === chatId);

      if (!chatId) {
        activeChat = await createChat(accessToken);
        chatId = activeChat.id;
        setActiveChatId(chatId);
        setChats((currentChats) => [activeChat as Chat, ...currentChats]);
      }

      const nextPosition = messages.length === 0
        ? 0
        : Math.max(...messages.map((message) => message.position)) + 1;
      const userMessage = await saveMessage(chatId, accessToken, "user", content, nextPosition);
      setMessages((currentMessages) => [...currentMessages, userMessage].sort((a, b) => a.position - b.position));

      if (!activeChat?.title) {
        const title = content.length > 48 ? `${content.slice(0, 48)}…` : content;
        updateChatTitle(chatId, accessToken, title).catch(console.error);
        setChats((currentChats) => currentChats.map((chat) => chat.id === chatId ? { ...chat, title } : chat));
      }

      const answer = await askAI(content);
      const assistantMessage = await saveMessage(chatId, accessToken, "assistant", answer, nextPosition + 1);
      setMessages((currentMessages) => [...currentMessages, assistantMessage].sort((a, b) => a.position - b.position));
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : "Could not send the message.");
      setPrompt(content);
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (checkingSession || !user) {
    return <main className="grid min-h-dvh place-items-center bg-[#f8f8f6] text-sm text-black/45">Loading Askly...</main>;
  }

  const displayName = user.email?.split("@")[0] ?? "Student";

  return (
    <main className="flex h-dvh overflow-hidden bg-[#f8f8f6] text-[#20201f]">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-black/8 bg-[#efefec] p-3 md:flex">
        <div className="flex h-12 items-center gap-3 px-2"><div className="grid size-8 place-items-center rounded-xl bg-[#20201f] text-sm font-semibold text-white">A</div><span className="font-semibold tracking-tight">Askly</span></div>
        <button type="button" onClick={handleNewConversation} disabled={creatingChat} className="mt-3 flex h-11 items-center gap-3 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium shadow-sm hover:bg-[#fafaf8] disabled:cursor-not-allowed disabled:opacity-50"><Icon name="edit" /> {creatingChat ? "Creating..." : "New conversation"}</button>
        <nav className="mt-7 min-h-0 flex-1 overflow-y-auto" aria-label="Chat history">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">Recent</p>
          {chatsLoading ? (
            <p className="px-3 py-2 text-sm text-black/40">Loading chats...</p>
          ) : chatsError ? (
            <p className="px-3 py-2 text-sm text-red-700/70">{chatsError}</p>
          ) : chats.length === 0 ? (
            <p className="px-3 py-2 text-sm text-black/40">No chats</p>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <button type="button" onClick={() => handleSelectChat(chat.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-black/5 ${activeChatId === chat.id ? "bg-black/[0.055] font-medium" : "text-black/65"}`}>
                    <Icon name="chat" />
                    <span className="truncate">{chat.title || "Untitled chat"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <div className="space-y-1 border-t border-black/8 pt-3">
          <button type="button" onClick={() => setActiveView("profile")} aria-current={activeView === "profile" ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-black/5 ${activeView === "profile" ? "bg-black/[0.055] font-medium text-black" : "text-black/65"}`}><Icon name="user" /> Profile</button>
          <button type="button" onClick={() => setActiveView("settings")} aria-current={activeView === "settings" ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-black/5 ${activeView === "settings" ? "bg-black/[0.055] font-medium text-black" : "text-black/65"}`}><Icon name="settings" /> Settings</button>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"><div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#d9ddd2] text-[#3b4434]"><Icon name="user" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium capitalize">{displayName}</p><p className="truncate text-xs text-black/45">{user.email}</p></div><button type="button" onClick={handleSignOut} className="rounded-lg px-2 py-1 text-xs font-medium text-black/50 hover:bg-black/5 hover:text-black">Log out</button></div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/6 px-4 md:px-6">
          <button type="button" aria-label="Open menu" className="grid size-10 place-items-center rounded-xl hover:bg-black/5 md:hidden"><Icon name="menu" /></button>
          <button type="button" onClick={() => setActiveView("conversation")} className="rounded-lg px-2 py-1 text-sm font-medium text-black/65 hover:bg-black/5">{activeView === "settings" ? "Settings" : activeView === "profile" ? "Profile" : "Askly"} {activeView === "conversation" && <span className="text-black/35">▾</span>}</button>
          {activeView === "conversation" ? <button type="button" className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-black/[0.02]">Share</button> : <div className="w-16" aria-hidden="true" />}
        </header>
        {activeView === "settings" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
              <div className="mb-9">
                <p className="text-sm font-medium text-black/45">Preferences</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">Settings</h1>
                <p className="mt-2 text-sm leading-6 text-black/50">Customize how Askly looks and handles your conversations.</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-6 border-b border-black/8 px-5 py-5 sm:px-6">
                  <div>
                    <h2 className="text-sm font-semibold">Dark mode</h2>
                    <p className="mt-1 text-sm text-black/45">Use a darker appearance for the interface.</p>
                  </div>
                  <button type="button" aria-label="Toggle dark mode" aria-pressed="false" className="relative h-7 w-12 shrink-0 rounded-full bg-black/15 transition-colors">
                    <span className="absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-6 px-5 py-5 sm:px-6">
                  <div>
                    <h2 className="text-sm font-semibold">Save chat history</h2>
                    <p className="mt-1 text-sm text-black/45">Keep your conversations available in the sidebar.</p>
                  </div>
                  <button type="button" aria-label="Toggle chat history" aria-pressed="true" className="relative h-7 w-12 shrink-0 rounded-full bg-[#20201f] transition-colors">
                    <span className="absolute right-1 top-1 size-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
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
        ) : activeView === "profile" ? (
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
                  <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:gap-6"><dt className="text-sm text-black/45">Email address</dt><dd className="break-all text-sm font-medium">{user.email}</dd></div>
                  <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:gap-6"><dt className="text-sm text-black/45">Account created</dt><dd className="text-sm font-medium">{formatAccountDate(user.created_at)}</dd></div>
                  <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:gap-6"><dt className="text-sm text-black/45">Last sign in</dt><dd className="text-sm font-medium">{formatAccountDate(user.last_sign_in_at)}</dd></div>
                  <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:gap-6"><dt className="text-sm text-black/45">Sign-in method</dt><dd className="text-sm font-medium capitalize">{user.app_metadata.provider ?? "Email"}</dd></div>
                  <div className="grid gap-1 pt-5 sm:grid-cols-[180px_1fr] sm:gap-6"><dt className="text-sm text-black/45">User ID</dt><dd className="break-all font-mono text-xs text-black/65">{user.id}</dd></div>
                </dl>
              </div>
            </div>
          </div>
        ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {messagesLoading ? (
            <div className="grid flex-1 place-items-center text-sm text-black/40">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-12 sm:px-8">
              <div className="mb-10 text-center"><div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-[#20201f] text-lg font-semibold text-white shadow-lg shadow-black/10">A</div><h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">What can I help you with?</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/50">Start a new conversation, ask a question, or continue one of your recent chats.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">{["Explain a difficult topic", "Help me brainstorm ideas", "Review some code", "Create a study plan"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)} className="rounded-2xl border border-black/8 bg-white p-4 text-left text-sm text-black/65 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/15 hover:text-black">{suggestion}</button>)}</div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl flex-1 space-y-7 px-5 py-10 sm:px-8">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "user" ? (
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-[#e7e7e2] px-4 py-3 text-[15px] leading-6 sm:max-w-[75%]">{message.content}</div>
                  ) : (
                    <div className="flex max-w-full items-start gap-3 sm:max-w-[90%]">
                      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[#20201f] text-xs font-semibold text-white">A</div>
                      <div className="whitespace-pre-wrap py-1 text-[15px] leading-7">{message.content}</div>
                    </div>
                  )}
                </div>
              ))}
              {sending && messages.at(-1)?.role === "user" && (
                <div className="flex items-start gap-3 text-black/45"><div className="grid size-8 place-items-center rounded-xl bg-[#20201f] text-xs font-semibold text-white">A</div><p className="py-1 text-sm">Thinking...</p></div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          <div className="sticky bottom-0 bg-gradient-to-t from-[#f8f8f6] via-[#f8f8f6] to-transparent px-4 pb-4 pt-8 sm:px-8 sm:pb-6">
            <div className="mx-auto max-w-3xl">
              {messageError && <p role="alert" className="mb-2 text-center text-sm text-red-700">{messageError}</p>}
              <form onSubmit={handleSendMessage} className="flex min-h-16 items-end gap-3 rounded-[22px] border border-black/10 bg-white p-2 pl-5 shadow-[0_8px_30px_rgba(0,0,0,0.07)]"><textarea aria-label="Message" placeholder="Message Askly" rows={1} value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={handleComposerKeyDown} disabled={sending || messagesLoading} className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-3 text-[15px] leading-5 outline-none placeholder:text-black/35 disabled:opacity-50" /><button type="submit" aria-label="Send message" disabled={sending || !prompt.trim()} className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#20201f] text-white hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40"><Icon name="send" /></button></form>
              <p className="mt-2 text-center text-[11px] text-black/35">Askly can make mistakes. Check important information.</p>
            </div>
          </div>
        </div>
        )}
      </section>
    </main>
  );
}
