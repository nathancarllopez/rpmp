import express from "express";
import generateReport from "./generateReport";

const router = express.Router();

router.post("/generate-report", generateReport);

export default router;