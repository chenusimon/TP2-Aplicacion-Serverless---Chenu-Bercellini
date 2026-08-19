export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  position: number;
  created_at: string;
}

export type CreateMessage = Pick<Message, "role" | "content" | "position">;
export type UpdateMessage = Partial<CreateMessage>;
