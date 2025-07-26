import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../QueryClientProvider";
import type { UpdateBackstockInfo } from "@repo/global-types/types";
import { supabase } from "../../supabase/client";

export function useUpdateBackstockMutation() {
  return useMutation({
    mutationFn: updateBackstock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backstock"] }),
  });
}

async function updateBackstock(updateInfo: UpdateBackstockInfo): Promise<UpdateBackstockInfo> {
  const { data, error } = await supabase.rpc("update_backstock_rows", {
    updates: updateInfo,
  });

  if (error) {
    console.warn("Error updating backstock rows");
    console.warn(error.message);

    throw error;
  }

  const undoUpdateInfo = data.reduce((undoInfo, row) => {
    const idString = row.id.toString();

    undoInfo[idString] = {
      weight: row.weight,
      created_at: row.created_at,
      deleted_on: row.deleted_on
    }

    return undoInfo;
  }, {} as UpdateBackstockInfo);

  return undoUpdateInfo;
}
