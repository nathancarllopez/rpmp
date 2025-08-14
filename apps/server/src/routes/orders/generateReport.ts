import { Request, Response } from "express";
import PDFDocumentWithTables from "pdfkit-table";
import { addCookSheetExplicit, addErrors, addMeals, addOrders, addPullList, addShopSheet, addSummary } from "./addPageHelpers";
import { AllProteinInfo, CookSheetInfo, Meal, Order, OrderError, OrderStatistics, PullListRow, StoreRow } from "../../types/types";

export default async function generateReport(
  req: Request,
  res: Response
): Promise<void> {
  const {
    meals,
    orders,
    orderErrors,
    stats,
    pullListInfo,
    shopSheetRows,
    cookSheetInfo,
    proteinInfo
  }: {
    meals: Meal[],
    orders: Order[],
    orderErrors: OrderError[],
    stats: OrderStatistics,
    pullListInfo: {
      extraRoastedVeggies: number;
      pullRows: PullListRow[];
    },
    shopSheetRows: [string, StoreRow[]][],
    cookSheetInfo: CookSheetInfo,
    proteinInfo: AllProteinInfo
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
    report.addPage();
    addPullList(report, stats, pullListInfo);
    report.addPage();
    addShopSheet(report, shopSheetRows)
    report.addPage();
    addCookSheetExplicit(report, cookSheetInfo, proteinInfo);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment");

    report.pipe(res);
    report.end();
  } catch (error) {
    console.log(error);
  }
}
