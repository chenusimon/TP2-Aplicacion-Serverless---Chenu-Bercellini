export interface Chat {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateChat = Pick<Chat, "title">;
export type UpdateChat = Partial<CreateChat>;
