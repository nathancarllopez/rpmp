import express from "express";
import generateReport from "./generateReport";
import generateOrderReview from "./generateOrderReview";

const router = express.Router();

router.post("/generate-report", generateReport);
router.post("/generate-review", generateOrderReview);

export default router;