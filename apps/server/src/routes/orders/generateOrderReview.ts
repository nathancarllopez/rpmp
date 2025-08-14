import { Request, Response } from "express";
import PDFDocumentWithTables from "pdfkit-table";
import { Meal, Order, OrderError, OrderStatistics } from "../../types/types";
import { addErrors, addMeals, addOrders, addSummary } from "./addPageHelpers";

export default async function generateOrderReview(
  req: Request,
  res: Response
): Promise<void> {
  const {
    meals,
    orders,
    orderErrors,
    stats,
  }: {
    meals: Meal[];
    orders: Order[];
    orderErrors: OrderError[];
    stats: OrderStatistics;
  } = req.body;

  try {
    const report = new PDFDocumentWithTables({ layout: "landscape" });

    if (orderErrors.length > 0) {
      addErrors(report, orderErrors);
      report.addPage();
    }

    addSummary(report, stats);
    report.addPage();
    addOrders(report, orders);
    report.addPage();
    addMeals(report, meals);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment");

    report.pipe(res);
    report.end();
  } catch (error) {
    console.log(error);
  }
}
