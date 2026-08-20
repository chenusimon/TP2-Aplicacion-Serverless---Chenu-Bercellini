"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Chat, Message, UpdateUserSettings, UserSettings } from "@/backend/model";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  askAI,
  createChat,
  deleteChat,
  fetchChats,
  fetchMessages,
  saveMessage,
  updateChatTitle,
  updateMessageContent,
} from "@/lib/api/chat-client";
import { fetchUserSettings, updateUserSettings } from "@/lib/api/settings-client";
import { AppHeader } from "./components/AppHeader";
import { ConversationPanel } from "./components/ConversationPanel";
import { ProfilePanel } from "./components/ProfilePanel";
import { PreferencesPanel } from "./components/PreferencesPanel";
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
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [savingSetting, setSavingSetting] = useState<keyof UpdateUserSettings | null>(null);
  const darkMode = settings?.dark_mode;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (darkMode === undefined) return;

    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("askly-theme", theme);
  }, [darkMode]);

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

      fetchUserSettings(session.access_token)
        .then(setSettings)
        .catch((error: unknown) => setSettingsError(getErrorMessage(error, "Could not load settings.")))
        .finally(() => setSettingsLoading(false));
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
    setChatsError("");
    setActiveChatId(null);
    setMessages([]);
    setMessageError("");

    if (settings?.save_history === false) return;

    setCreatingChat(true);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      const newChat = await createChat(accessToken);
      setChats((current) => [newChat, ...current.filter((chat) => chat.id !== newChat.id)]);
      setActiveChatId(newChat.id);
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

  async function handleDeleteChat(chat: Chat) {
    const title = chat.title || "Untitled chat";
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;

    setDeletingChatId(chat.id);
    setChatsError("");

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      await deleteChat(chat.id, accessToken);
      setChats((current) => current.filter((currentChat) => currentChat.id !== chat.id));

      if (activeChatId === chat.id) {
        setActiveChatId(null);
        setMessages([]);
        setMessageError("");
      }
    } catch (error) {
      setChatsError(getErrorMessage(error, "Could not delete the conversation."));
    } finally {
      setDeletingChatId(null);
    }
  }

  async function handleRenameChat(chatId: string, title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return false;

    setRenamingChatId(chatId);
    setChatsError("");

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return false;

      await updateChatTitle(chatId, accessToken, trimmedTitle);
      setChats((current) => {
        const renamedChat = current.find((chat) => chat.id === chatId);
        if (!renamedChat) return current;
        return [
          { ...renamedChat, title: trimmedTitle, updated_at: new Date().toISOString() },
          ...current.filter((chat) => chat.id !== chatId),
        ];
      });
      return true;
    } catch (error) {
      setChatsError(getErrorMessage(error, "Could not rename the conversation."));
      return false;
    } finally {
      setRenamingChatId(null);
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
      if (settings?.save_history === false) {
        await sendTemporaryMessage(content);
        return;
      }

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

  async function handleRegenerateResponse(messageId: string) {
    if (sending) return;

    const assistantMessage = messages.find((message) => message.id === messageId);
    const userMessage = messages
      .filter((message) => message.role === "user" && message.position < (assistantMessage?.position ?? 0))
      .at(-1);
    if (!assistantMessage || !userMessage) return;

    setSending(true);
    setRegeneratingMessageId(messageId);
    setMessageError("");

    try {
      const answer = await askAI(userMessage.content);
      let updatedMessage = { ...assistantMessage, content: answer };

      if (settings?.save_history !== false && assistantMessage.chat_id !== "temporary") {
        const accessToken = await getAccessToken();
        if (!accessToken) return;
        updatedMessage = await updateMessageContent(messageId, accessToken, answer);
      }

      setMessages((current) => current.map((message) => message.id === messageId ? updatedMessage : message));
    } catch (error) {
      setMessageError(getErrorMessage(error, "Could not regenerate the response."));
    } finally {
      setSending(false);
      setRegeneratingMessageId(null);
    }
  }

  async function handleSettingChange(
    setting: "dark_mode" | "save_history",
    enabled: boolean,
  ) {
    if (!settings || savingSetting) return;

    const previousSettings = settings;
    setSettings({ ...settings, [setting]: enabled });
    setSavingSetting(setting);
    setSettingsError("");

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setSettings(previousSettings);
        return;
      }

      const updatedSettings = await updateUserSettings(accessToken, { [setting]: enabled });
      setSettings(updatedSettings);

      if (setting === "save_history") {
        setActiveChatId(null);
        setMessages([]);
        setMessageError("");
      }
    } catch (error) {
      setSettings(previousSettings);
      setSettingsError(getErrorMessage(error, "Could not update settings."));
    } finally {
      setSavingSetting(null);
    }
  }

  async function sendTemporaryMessage(content: string) {
    const nextPosition = getNextMessagePosition(messages);
    appendMessage(createTemporaryMessage("user", content, nextPosition));

    const answer = await askAI(content);
    appendMessage(createTemporaryMessage("assistant", answer, nextPosition + 1));
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
    return <main className="grid min-h-dvh place-items-center bg-app-background text-sm text-app-muted">Loading Askly...</main>;
  }

  const displayName = user.email?.split("@")[0] ?? "Student";

  return (
    <main className="flex h-dvh overflow-hidden bg-app-background text-app-foreground">
      <Sidebar
        user={user}
        displayName={displayName}
        chats={chats}
        activeChatId={activeChatId}
        activeView={activeView}
        chatsLoading={chatsLoading}
        chatsError={chatsError}
        creatingChat={creatingChat}
        deletingChatId={deletingChatId}
        renamingChatId={renamingChatId}
        historyEnabled={settings?.save_history ?? true}
        onNewConversation={handleNewConversation}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onChangeView={setActiveView}
        onSignOut={handleSignOut}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <AppHeader activeView={activeView} onShowConversation={() => setActiveView("conversation")} />
        {activeView === "settings" && (
          <SettingsPanel
            user={user}
            displayName={displayName}
            settings={settings}
            loading={settingsLoading}
            savingSetting={savingSetting}
            error={settingsError}
            onSettingChange={handleSettingChange}
          />
        )}
        {activeView === "profile" && <ProfilePanel user={user} displayName={displayName} />}
        {activeView === "preferences" && <PreferencesPanel />}
        {activeView === "conversation" && (
          <ConversationPanel
            messages={messages}
            prompt={prompt}
            loading={messagesLoading}
            sending={sending}
            regeneratingMessageId={regeneratingMessageId}
            error={messageError}
            messagesEndRef={messagesEndRef}
            onPromptChange={setPrompt}
            onSubmit={handleSendMessage}
            onRegenerate={handleRegenerateResponse}
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

function createTemporaryMessage(
  role: Message["role"],
  content: string,
  position: number,
): Message {
  return {
    id: crypto.randomUUID(),
    chat_id: "temporary",
    role,
    content,
    position,
    created_at: new Date().toISOString(),
  };
}
