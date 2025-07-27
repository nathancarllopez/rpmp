import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";
import type { ProfileRow } from "../../types/types";

export function allProfilesOptions() {
  return queryOptions({
    queryKey: ["allProfiles"],
    queryFn: getAllProfiles,
    staleTime: Infinity,
  });
}

async function getAllProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });

  if (error) {
    console.log("Error fetching profiles:", error.message);
    console.log(error.code);

    throw error;
  }

  const profiles: ProfileRow[] = data.map((profile) => snakeToCamel<ProfileRow>(profile));

  return profiles;
}
