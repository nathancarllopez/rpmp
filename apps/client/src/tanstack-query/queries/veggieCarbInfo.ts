import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";
import type { VeggieCarbInfoRow } from "../../types/types";

export function veggieCarbInfoOptions() {
  return queryOptions({
    queryKey: ["veggieCarbInfo"],
    queryFn: getVeggieCarbInfo,
    staleTime: Infinity,
  });
}

async function getVeggieCarbInfo(): Promise<VeggieCarbInfoRow[]> {
  const { data, error } = await supabase.from("veggie_carb_info").select();

  if (error) {
    console.warn("Failed to fetch veggies and carbs");
    console.warn(error.message);

    throw error;
  }

  const veggieCarbInfo: VeggieCarbInfoRow[] = data.map((row) =>
    snakeToCamel<VeggieCarbInfoRow>(row)
  );

  return veggieCarbInfo;
}
