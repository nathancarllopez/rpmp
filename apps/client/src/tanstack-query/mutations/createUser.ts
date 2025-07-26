import type { ProfileRow, SettingsRow } from "@repo/global-types/types";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../QueryClientProvider";
import type { InsertProfileRow, CreatedUserInfo, NewUserInfo } from "@repo/global-types/types";
import { camelToSnake, snakeToCamel } from "../../util/key-converters";

export function useCreateUserMutation(invokerId: string) {
  return useMutation({
    mutationFn: (info: NewUserInfo) => createUser(info, invokerId),
    onSuccess: ({ profile, profilePicUrl, settings }) => {
      queryClient.setQueryData(["allProfiles"], (prevData: ProfileRow[]) => [
        ...prevData,
        profile,
      ]);
      queryClient.setQueryData(["profilePic", profile.userId], profilePicUrl);
      queryClient.setQueryData(["settings", profile.userId], settings);
    },
  });
}

const endpoint = "/auth/create-user";

async function createUser(
  info: NewUserInfo,
  invokerId: string
): Promise<CreatedUserInfo> {
  const authStr = `Bearer ${invokerId}`;
  const apiUrl = import.meta.env.VITE_BACKEND_URL + endpoint;
  
  const { email, profileData } = info;
  const insertData = camelToSnake<InsertProfileRow>(profileData);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authStr,
    },
    body: JSON.stringify({ email, profileData: insertData }),
  });

  if (!response.ok) {
    console.warn("Failed to create user");
    const error = await response.json();

    if (error instanceof Error) {
      console.warn(error.message);
    } else {
      console.warn(JSON.stringify(error));
    }

    throw new Error(error?.message || JSON.stringify(error));
  }

  const { profile, profilePicUrl, settings } = await response.json();
  return {
    profile: snakeToCamel<ProfileRow>(profile),
    profilePicUrl,
    settings: snakeToCamel<SettingsRow>(settings),
  };
}
