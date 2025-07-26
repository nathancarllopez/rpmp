import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../QueryClientProvider";
import type { InsertTimecardHistoryRow, TimecardHistoryRow } from "@repo/global-types/types";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";

export function useInsertTimecardHisotryMutation() {
  return useMutation({
    mutationFn: insertTimecardHisotry,
    onSuccess: (data) =>
      queryClient.setQueryData(
        ["timecardHistory"],
        (curr: TimecardHistoryRow[] = []) => [data, ...curr]
      ),
  });
}

async function insertTimecardHisotry(
  newTimecards: InsertTimecardHistoryRow
): Promise<TimecardHistoryRow> {
  const { data, error } = await supabase
    .from("timecards_history")
    .insert(newTimecards)
    .select()
    .single();

  if (error) {
    console.warn("Failed to insert new timecard");
    console.warn(error.message);

    throw error;
  }

  const timecardHistoryRow: TimecardHistoryRow =
    snakeToCamel<TimecardHistoryRow>(data);

  return timecardHistoryRow;
}
