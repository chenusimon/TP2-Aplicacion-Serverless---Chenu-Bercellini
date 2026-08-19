export interface UserSettings {
  id: string;
  user_id: string;
  dark_mode: boolean;
  save_history: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateUserSettings = Pick<UserSettings, "dark_mode" | "save_history">;
export type UpdateUserSettings = Partial<CreateUserSettings>;
