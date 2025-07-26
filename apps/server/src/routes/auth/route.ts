import express from "express";
import createUser from "./createUser";
import deleteUser from "./deleteUser";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = express.Router();

router.post("/create-user", requireAdmin, createUser);
router.post("/delete-user", requireAdmin, deleteUser);

export default router;