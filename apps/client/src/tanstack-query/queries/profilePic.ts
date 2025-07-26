import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";

export function profilePicOptions(userId?: string) {
  if (!userId) {
    throw new Error("User Id is required");
  }
  
  return queryOptions({
    queryKey: ["profilePic", userId],
    queryFn: () => getProfilePicUrl(userId),
    staleTime: Infinity,
  });
}

async function getProfilePicUrl(
  userId: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("avatars")
    .list("profilePics", {
      search: `${userId}`,
    });

  if (error) {
    console.warn("Supabase error listing profile pictures:")
    console.warn(error.message);
    throw error;
  } else if (!data) {
    throw new Error("Supabase didn't return any data from profilePics storage bucket")
  } else if (!Array.isArray(data)) {
    throw new Error(`Supabase did not return an array: ${JSON.stringify(data)}`)
  } else if (data.length === 0) {
    throw new Error("No profile pictures returned from supabase")
  }

  const profilePic = data.find((file) => file.name.startsWith(userId));
  if (!profilePic) {
    throw new Error("Profile picture not found.");
  }

  const filePath = `profilePics/${profilePic.name}`;
  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}