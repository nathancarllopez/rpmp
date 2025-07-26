import { Request, Response } from "express";
import { supabase } from "../../supabase-client";
import type { InsertSettingsRow } from "@repo/global-types/types";

export default async function createUser(
  req: Request,
  res: Response
): Promise<void> {
  const { email, profileData = {} } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  /** Create new user */
  const {
    data: { user },
    error: createError,
  } = await supabase.auth.admin.createUser({
    email,
    password: "rpmp-password",
    email_confirm: true,
    user_metadata: {
      has_signed_in: false,
    },
  });

  if (createError) {
    console.log("createError");
    console.log(createError?.message);
    res
      .status(500)
      .json({ error: createError?.message || "User creation failed" });
    return;
  } else if (!user) {
    console.log("No user returned");
    res.status(500).json({ error: "No user returned" });
    return;
  }

  /** Add row to profile table */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      ...profileData,
      user_id: user.id,
      kitchen_rate: profileData.kitchen_rate || null,
      driving_rate: profileData.driving_rate || null,
    })
    .select()
    .single();

  if (profileError) {
    console.log("profileError");
    console.log(profileError.message);
    res.status(500).json({ error: profileError.message });
    return;
  } else if (!profile) {
    console.log("No profile returned");
    res.status(500).json({ error: "No profile returned" });
    return;
  }

  /** Add row to settings table */
  const defaultSettings = createSettingsRow(user.id);
  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .insert(defaultSettings)
    .select()
    .single();

  /** Add profile picture to storage */
  const { data: profilePicData , error: avatarError } = await supabase.storage
    .from("avatars")
    .copy("image-missing.jpg", `profilePics/${user.id}.jpg`);

  if (avatarError) {
    console.log("avatarError");
    console.log(avatarError.message);
    res.status(500).json({ error: avatarError.message });
    return;
  } else if (!profilePicData) {
    console.log("No profile pic returned");
    res.status(500).json({ error: "No profile pic returned" });
    return;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(profilePicData.path);
  const profilePicUrl = data.publicUrl;

  res.status(200).json({ profile, settings, profilePicUrl });
}

function createSettingsRow(userId: string): InsertSettingsRow {
  return {
    user_id: userId,
    general: {},
    orders: {
      skipEdits: false,
    },
    backstock: {},
    timecards: {},
    finances: {},
    menu: {},
    employees: {},
  };
}
