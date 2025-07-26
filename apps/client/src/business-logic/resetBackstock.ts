import { supabase } from "../supabase/client";
import { queryClient } from "../tanstack-query/QueryClientProvider";

export async function resetBackstock() {
  const { data, error } = await supabase
    .from("backstock_proteins")
    .update({ available: true, deleted_on: null })
    .gt('id', 0);

  queryClient.invalidateQueries({ queryKey: ["backstock"] }),

  console.log(data);
  console.log(error);
  
  console.log("done");
}