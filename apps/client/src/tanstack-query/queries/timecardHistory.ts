import type { TimecardHistoryRow } from "@repo/global-types/types";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";

export function timecardHistoryOptions() {
  return queryOptions({
    queryKey: ["timecardHistory"],
    queryFn: getTimecardHistory,
    staleTime: Infinity,
  });
}

async function getTimecardHistory(): Promise<TimecardHistoryRow[]> {
  const { data, error } = await supabase
    .from("timecards_history")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Failed to fetch timecards history");
    console.warn(error.message);

    throw error;
  }

  const timecardHistory: TimecardHistoryRow[] = data.map((row) =>
    snakeToCamel<TimecardHistoryRow>(row)
  );

  return timecardHistory;
}
