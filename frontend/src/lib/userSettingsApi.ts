import { apiClient } from "@/lib/apiClient";
import type { UpdateUserSettingsBody, UserSettings } from "@/types/userSettings";

export function fetchUserSettings(signal?: AbortSignal): Promise<UserSettings> {
  return apiClient<UserSettings>("/me/settings", { signal });
}

export function updateUserSettings(body: UpdateUserSettingsBody): Promise<UserSettings> {
  return apiClient<UserSettings>("/me/settings", {
    method: "PATCH",
    data: body,
  });
}
