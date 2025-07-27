import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../QueryClientProvider";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";
import type { PullListRow, UpdatePullListInfo } from "../../types/types";

export function useUpdatePullListMutation() {
  return useMutation({
    mutationFn: updatePullList,
    onSuccess: (data) => queryClient.setQueryData(["pullList"], data),
  });
}

async function updatePullList({
  idsToDelete,
  updates,
}: UpdatePullListInfo): Promise<PullListRow[]> {
  const { error: deleteError } = await supabase
    .from("pull_list")
    .delete()
    .in("id", Array.from(idsToDelete));

  if (deleteError) {
    console.warn("Error deleting pull list rows");
    console.warn(deleteError.message);

    throw deleteError;
  }

  const updatePromises = updates.map((row, index) =>
    supabase
      .from("pull_list")
      .update({
        freezer_monday: row.freezerMonday,
        freezer_sunday: row.freezerSunday,
        display_order: index,
      })
      .eq("id", row.id)
      .select()
      .single()
  );

  const updateResults = await Promise.all(updatePromises);

  const updateErrors = updateResults.filter((result) => result.error);

  if (updateErrors.length > 0) {
    console.warn("Errors updating the pull list rows");
    updateErrors.forEach((error) => console.warn(error));

    throw new Error("Errors encountered updating the pull list rows");
  }

  const updatedPullList = updateResults.map((result) => snakeToCamel<PullListRow>(result.data));

  return updatedPullList;
}