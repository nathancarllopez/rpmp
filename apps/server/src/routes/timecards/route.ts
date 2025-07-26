import express from "express";
import generateTimecards from "./generateTimecards";

const router = express.Router();

router.post("/generate-timecards", generateTimecards);

export default router;