import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";
import type { SettingsRow } from "../../types/types";

export function settingsOptions(userId: string | undefined) {
  if (!userId) {
    throw new Error("User Id is required to fetch settings");
  }

  return queryOptions({
    queryKey: ["settings", userId],
    queryFn: () => getSettingsById(userId),
    staleTime: Infinity,
  });
}

async function getSettingsById(userId: string): Promise<SettingsRow> {
  const { data, error } = await supabase
    .from("settings")
    .select()
    .eq("user_id", userId)
    .single();

  if (error) {
    console.warn("Failed to fetch settings");
    console.warn(error.message);

    throw error;
  }

  const settings: SettingsRow = snakeToCamel<SettingsRow>(data);

  return settings;
}
