import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../QueryClientProvider";
import { supabase } from "../../supabase/client";
import type { InsertBackstockRow } from "../../types/types";

export function useInsertBackstockMutation() {
  return useMutation({
    mutationFn: insertBackstock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backstock"] }),
  });
}

async function insertBackstock(newBackstock: InsertBackstockRow[]) {
  const { error } = await supabase
    .from("backstock_proteins")
    .insert(newBackstock);

  if (error) {
    console.warn("Failed to insert new backstock rows");
    console.warn(error.message);

    throw error;
  }
}
