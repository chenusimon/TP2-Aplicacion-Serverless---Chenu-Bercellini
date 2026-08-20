import type { Chat, Message, MessageRole } from "@/backend/model";

type ApiResult<T> = {
  data?: T;
  error?: string;
};

export async function fetchChats(accessToken: string): Promise<Chat[]> {
  const response = await fetch("/api/chats", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = (await response.json()) as ApiResult<Chat[]>;

  if (!response.ok) {
    throw new Error(result.error ?? "Could not load chats.");
  }

  return result.data ?? [];
}

export async function createChat(accessToken: string): Promise<Chat> {
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: null }),
  });
  const result = (await response.json()) as ApiResult<Chat>;

  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "Could not create a new chat.");
  }

  return result.data;
}

export async function fetchMessages(
  chatId: string,
  accessToken: string,
): Promise<Message[]> {
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = (await response.json()) as ApiResult<Message[]>;

  if (!response.ok) {
    throw new Error(result.error ?? "Could not load messages.");
  }

  return (result.data ?? []).sort((a, b) => a.position - b.position);
}

export async function saveMessage(
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
  const result = (await response.json()) as ApiResult<Message>;

  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "Could not save message.");
  }

  return result.data;
}

export async function updateChatTitle(
  chatId: string,
  accessToken: string,
  title: string,
): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error("Could not update the chat title.");
  }
}

export async function deleteChat(chatId: string, accessToken: string): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Could not delete the conversation.");
  }
}

export async function askAI(prompt: string): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const result = (await response.json()) as {
    response?: string;
    error?: string;
  };

  if (!response.ok || !result.response) {
    throw new Error(result.error ?? "The AI could not answer.");
  }

  return result.response;
}
