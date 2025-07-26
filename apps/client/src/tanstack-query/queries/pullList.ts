import type { PullListRow } from "@repo/global-types/types";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";

export function pullListOptions() {
  return queryOptions({
    queryKey: ["pullList"],
    queryFn: getPullList,
    staleTime: Infinity,
  });
}

async function getPullList(): Promise<PullListRow[]> {
  const { data, error } = await supabase
    .from("pull_list")
    .select()
    .order("display_order", { ascending: true });

  if (error) {
    console.warn("Failed to fetch pull list");
    console.warn(error.message);

    throw error;
  }

  const pullList: PullListRow[] = data.map((row) =>
    snakeToCamel<PullListRow>(row)
  );

  return pullList;
}
