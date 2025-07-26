import { Request, Response } from "express";
import { supabase } from "../../supabase-client";

export default async function deleteUser(
  req: Request,
  res: Response
): Promise<void> {
  const { idToDelete } = req.body;

  if (!idToDelete) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    idToDelete
  );

  if (deleteError) {
    console.log("deleteError");
    console.log(deleteError.message);
    res.status(500).json({ error: deleteError.message });
    return;
  }

  // List all files in profilePics/
  const { data, error: findPicError } = await supabase.storage
    .from("avatars")
    .list("profilePics", {
      limit: 100, // max number of files to scan
      search: `${idToDelete}`, // optional, narrows down matches
    });

  if (findPicError) {
    console.log("findPicError");
    console.log(findPicError.message);
    res.status(500).json({ error: findPicError.message });
    return;
  }

  if (!data || data.length === 0) {
    res.status(200).json({ idToDelete });
    return;
  }

  // Find file with name starting with userId (should be exact match + extension)
  const profilePic = data.find((file) => file.name.startsWith(idToDelete));

  if (!profilePic) {
    res.status(200).json({ idToDelete });
    return;
  }

  const { error: deletePicError } = await supabase.storage
    .from("avatars")
    .remove([`profilePics/${profilePic.name}`]);

  if (deletePicError) {
    console.log("deletePicError");
    console.log(deletePicError.message);
    res.status(500).json({ error: deletePicError.message });
    return;
  }

  res.status(200).json({ idToDelete });
}
