import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";
import type { ProteinWithFlavorsRow } from "../../types/types";

export function proteinsAndFlavorsOptions() {
  return queryOptions({
    queryKey: ["proteinsAndFlavors"],
    queryFn: getProteinsAndFlavors,
    staleTime: Infinity,
  });
}

async function getProteinsAndFlavors(): Promise<ProteinWithFlavorsRow[]> {
  const { data, error } = await supabase
    .from("proteins_with_flavors")
    .select()
    .order("protein_label", { ascending: true });

  if (error) {
    console.warn("Failed to fetch proteins with flavors");
    console.warn(error.message);

    throw error;
  }

  const proteinsWithFlavors: ProteinWithFlavorsRow[] = data.map((row) => {
    const sortedRow = {
      ...row,
      flavors: row.flavors.sort((flavorA, flavorB) => flavorA.label.localeCompare(flavorB.label))
    };

    return snakeToCamel<ProteinWithFlavorsRow>(sortedRow)
  })

  return proteinsWithFlavors;
}
