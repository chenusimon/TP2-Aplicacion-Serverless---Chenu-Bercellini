"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Chat, Message } from "@/backend/model";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  askAI,
  createChat,
  fetchChats,
  fetchMessages,
  saveMessage,
  updateChatTitle,
} from "@/lib/api/chat-client";
import { AppHeader } from "./components/AppHeader";
import { ConversationPanel } from "./components/ConversationPanel";
import { ProfilePanel } from "./components/ProfilePanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { Sidebar } from "./components/Sidebar";
import type { AppView } from "./types";

export default function Home() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AppView>("conversation");
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState("");
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
      const session = data.session;
      setUser(session?.user ?? null);
      setCheckingSession(false);

      if (!session) {
        setChatsLoading(false);
        router.replace("/login");
        return;
      }

      fetchChats(session.access_token)
        .then(setChats)
        .catch((error: unknown) => setChatsError(getErrorMessage(error, "Could not load chats.")))
        .finally(() => setChatsLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.replace("/login");
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function getAccessToken() {
    const { data } = await getSupabaseClient().auth.getSession();

    if (!data.session) {
      router.replace("/login");
      return null;
    }

    return data.session.access_token;
  }

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
    router.replace("/login");
  }

  async function handleNewConversation() {
    setActiveView("conversation");
    setCreatingChat(true);
    setChatsError("");

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      const newChat = await createChat(accessToken);
      setChats((current) => [newChat, ...current.filter((chat) => chat.id !== newChat.id)]);
      setActiveChatId(newChat.id);
      setMessages([]);
      setMessageError("");
    } catch (error) {
      setChatsError(getErrorMessage(error, "Could not create a new chat."));
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
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      setMessages(await fetchMessages(chatId, accessToken));
    } catch (error) {
      setMessages([]);
      setMessageError(getErrorMessage(error, "Could not load messages."));
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
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      const { chatId, chat } = await getOrCreateActiveChat(accessToken);
      const nextPosition = getNextMessagePosition(messages);
      const userMessage = await saveMessage(chatId, accessToken, "user", content, nextPosition);
      appendMessage(userMessage);

      if (!chat.title) updateUntitledChat(chatId, accessToken, content);

      const answer = await askAI(content);
      const assistantMessage = await saveMessage(chatId, accessToken, "assistant", answer, nextPosition + 1);
      appendMessage(assistantMessage);
    } catch (error) {
      setMessageError(getErrorMessage(error, "Could not send the message."));
      setPrompt(content);
    } finally {
      setSending(false);
    }
  }

  async function getOrCreateActiveChat(accessToken: string) {
    const existingChat = chats.find((chat) => chat.id === activeChatId);
    if (activeChatId && existingChat) return { chatId: activeChatId, chat: existingChat };

    const newChat = await createChat(accessToken);
    setActiveChatId(newChat.id);
    setChats((current) => [newChat, ...current]);
    return { chatId: newChat.id, chat: newChat };
  }

  function appendMessage(message: Message) {
    setMessages((current) => [...current, message].sort((a, b) => a.position - b.position));
  }

  function updateUntitledChat(chatId: string, accessToken: string, content: string) {
    const title = content.length > 48 ? `${content.slice(0, 48)}…` : content;
    setChats((current) => current.map((chat) => chat.id === chatId ? { ...chat, title } : chat));
    void updateChatTitle(chatId, accessToken, title).catch(console.error);
  }

  if (checkingSession || !user) {
    return <main className="grid min-h-dvh place-items-center bg-[#f8f8f6] text-sm text-black/45">Loading Askly...</main>;
  }

  const displayName = user.email?.split("@")[0] ?? "Student";

  return (
    <main className="flex h-dvh overflow-hidden bg-[#f8f8f6] text-[#20201f]">
      <Sidebar
        user={user}
        displayName={displayName}
        chats={chats}
        activeChatId={activeChatId}
        activeView={activeView}
        chatsLoading={chatsLoading}
        chatsError={chatsError}
        creatingChat={creatingChat}
        onNewConversation={handleNewConversation}
        onSelectChat={handleSelectChat}
        onChangeView={setActiveView}
        onSignOut={handleSignOut}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <AppHeader activeView={activeView} onShowConversation={() => setActiveView("conversation")} />
        {activeView === "settings" && <SettingsPanel user={user} displayName={displayName} />}
        {activeView === "profile" && <ProfilePanel user={user} displayName={displayName} />}
        {activeView === "conversation" && (
          <ConversationPanel
            messages={messages}
            prompt={prompt}
            loading={messagesLoading}
            sending={sending}
            error={messageError}
            messagesEndRef={messagesEndRef}
            onPromptChange={setPrompt}
            onSubmit={handleSendMessage}
          />
        )}
      </section>
    </main>
  );
}

function getNextMessagePosition(messages: Message[]) {
  return messages.length === 0
    ? 0
    : Math.max(...messages.map((message) => message.position)) + 1;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
