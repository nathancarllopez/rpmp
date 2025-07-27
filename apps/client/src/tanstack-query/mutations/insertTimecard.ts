import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../QueryClientProvider";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";
import type { InsertTimecardHistoryRow, TimecardHistoryRow } from "../../types/types";

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
