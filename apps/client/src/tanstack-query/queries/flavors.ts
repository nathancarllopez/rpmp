import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";
import type { FlavorRow } from "../../types/types";

export function flavorsOptions() {
  return queryOptions({
    queryKey: ["flavors"],
    queryFn: getFlavors,
    staleTime: Infinity,
  });
}

async function getFlavors(): Promise<FlavorRow[]> {
  const { data, error } = await supabase
    .from("flavors")
    .select()
    .order("label", { ascending: true });

  if (error) {
    console.warn("Failed to fetch flavors");
    console.warn(error.message);

    throw error;
  }

  const flavors: FlavorRow[] = data
    .map((row) => snakeToCamel<FlavorRow>(row));

  return flavors;
}
