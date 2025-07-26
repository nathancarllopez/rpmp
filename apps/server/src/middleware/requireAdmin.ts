import { NextFunction, Request, RequestHandler, Response } from "express";
import { supabase } from "../supabase-client";

export const requireAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Missing or invalid Authorization header");
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const userId = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.admin.getUserById(userId);

  if (userError) {
    console.log("userError", userError);
    res.status(500).json({ error: `Failed to get user: ${userError.message}` });
    return;
  } else if (!user) {
    console.log("Invalid token");
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    res
      .status(500)
      .json({ error: `Failed to get user role: ${profileError.message}` });
    return;
  }

  const hasPermission =
    profile?.role && ["admin", "owner"].includes(profile.role);
  if (!profile || !hasPermission) {
    res
      .status(403)
      .json({ error: "Forbidden: user does not have correct permissions" });
    return;
  }

  (req as any).user = user;

  next();
};
