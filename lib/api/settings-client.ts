import type { UpdateUserSettings, UserSettings } from "@/backend/model";

type SettingsResult = {
  data?: UserSettings;
  error?: string;
};

const defaultSettings = {
  dark_mode: true,
  save_history: true,
};

export async function fetchUserSettings(accessToken: string): Promise<UserSettings> {
  const response = await fetch("/api/user-settings", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 404) {
    return createUserSettings(accessToken);
  }

  const result = (await response.json()) as SettingsResult;
  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "Could not load settings.");
  }

  return result.data;
}

export async function updateUserSettings(
  accessToken: string,
  changes: UpdateUserSettings,
): Promise<UserSettings> {
  const response = await fetch("/api/user-settings", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(changes),
  });
  const result = (await response.json()) as SettingsResult;

  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "Could not update settings.");
  }

  return result.data;
}

async function createUserSettings(accessToken: string): Promise<UserSettings> {
  const response = await fetch("/api/user-settings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(defaultSettings),
  });
  const result = (await response.json()) as SettingsResult;

  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "Could not create settings.");
  }

  return result.data;
}
