import type { SettingsRow, UpdateSettingsInfo } from "@repo/global-types/types";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../QueryClientProvider";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";

export function useUpdateSettingsMutation(userId: string | undefined) {
  if (!userId) {
    throw new Error("User Id is required to update settings");
  }

  return useMutation({
    mutationFn: (updateInfo: UpdateSettingsInfo) =>
      updateSettings(updateInfo, userId),
    onSuccess: (data) => queryClient.setQueryData(["settings", userId], data),
  });
}

async function updateSettings(
  updateInfo: UpdateSettingsInfo,
  userId: string
): Promise<SettingsRow> {
  const { data, error } = await supabase
    .from("settings")
    .update(updateInfo)
    .eq("user_id", userId)
    .select();

  if (error) {
    console.warn("Failed to update settings");
    console.warn(error.message);

    throw error;
  }
  
  const newSettings = snakeToCamel<SettingsRow>(data);

  return newSettings;
}
