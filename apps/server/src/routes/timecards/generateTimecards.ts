import { TimecardDisplayValues } from "@repo/global-types/types";
import { Request, Response } from "express";
import PDFDocumentWithTables from "pdfkit-table";

export default async function generateTimecards(
  req: Request,
  res: Response
): Promise<void> {
  const { timecards }: { timecards: TimecardDisplayValues[] } = req.body;

  const doc = new PDFDocumentWithTables();
  doc.pipe(res);

  const getAmount = (currencyString: string) => parseFloat(currencyString.replace("$", ""));

  const timecardsWithTotals = timecards.filter((timecard) => getAmount(timecard.grandTotal) > 0);

  timecardsWithTotals.forEach((timecard, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // Try to add logo right aligned at the same height as name/date
    const logoWidth = 100;
    let logoHeight = 0;
    let logoY = doc.y;

    try {
      const img = "src/assets/logo.png";
      doc.image(img, doc.page.width - doc.page.margins.right - logoWidth, logoY - logoWidth / 2, { width: logoWidth });
      logoHeight = doc.y - logoY;
      doc.y = logoY;
    } catch (err) {
      console.warn('Logo not found or failed to load:', (err as Error).message);
    }

    // Name and date left aligned at same height as logo
    doc
      .fontSize(20)
      .text(`${timecard.fullName}`, doc.page.margins.left, logoY, { align: 'left', continued: false })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' })
      .moveDown(logoHeight > 0 ? logoHeight / doc.currentLineHeight() : 1);

    // Pay Rates
    doc.table({
      title: 'Pay Rates',
      headers: ['Kitchen Rate ($/hr)', 'Driving Rate ($/hr)'],
      rows: [[timecard.kitchenRate, timecard.drivingRate]],
    });

    doc.moveDown(1);

    // Sunday Work
    const sundayTotal = getAmount(timecard.sundayTotalPay);
    if (sundayTotal > 0) {
      doc.table({
        title: 'Sunday',
        headers: [
          'Kitchen Start',
          'Kitchen End',
          'Total Hours',
          'OT Hours',
        ],
        rows: [[
          timecard.sundayStart,
          timecard.sundayEnd,
          timecard.sundayTotalHours,
          timecard.sundayOvertimeHours,
        ],[
          "",
          "",
          `Reg Pay: ${timecard.sundayRegularPay}`,
          `OT Pay: ${timecard.sundayOvertimePay}`,
        ],[
          "",
          "",
          "",
          `Total Pay: ${timecard.sundayTotalPay}`,
        ]],
      });

      doc.moveDown(1);
    }

    // Monday Work – Kitchen
    const mondayKitchenAmount = getAmount(timecard.mondayTotalPay);
    if (mondayKitchenAmount > 0) {
      doc.table({
        title: 'Monday - Kitchen',
        headers: [
          'Kitchen Start',
          'Kitchen End',
          'Total Hours',
          'OT Hours',
        ],
        rows: [[
          timecard.mondayStart,
          timecard.mondayEnd,
          timecard.mondayTotalHours,
          timecard.mondayOvertimeHours,
        ],[
          "",
          "",
          `Reg Pay: ${timecard.mondayRegularPay}`,
          `OT Pay: ${timecard.mondayOvertimePay}`,
        ],[
          "",
          "",
          "",
          `Total Pay: ${timecard.mondayTotalPay}`,
        ]],
      });

      doc.moveDown(1);
    }
    
    // Monday Work – Driving
    const mondayDrivingAmount = getAmount(timecard.drivingTotalPay);
    if (mondayDrivingAmount > 0) {
      doc.table({
        title: 'Monday - Driving',
        headers: [
          'Driving Start',
          'Driving End',
          'Total Hours',
          'OT Hours',
        ],
        rows: [[
          timecard.drivingStart,
          timecard.drivingEnd,
          timecard.drivingTotalHours,
          timecard.drivingOvertimeHours,
        ],[
          `Route 1: ${timecard.route1}`,
          `Route 2: ${timecard.route2}`,
          `Reg Pay: ${timecard.drivingRegularPay}`,
          `OT Pay: ${timecard.drivingOvertimePay}`,
        ],[
          "",
          "",
          "",
          `Total Pay: ${timecard.drivingTotalPay}`,
        ]],
      });

      doc.table({
        title: 'Driving Cost Breakdown',
        headers: ['# Stops', 'Cost per Stop', 'Total Cost'],
        rows: [[
          timecard.stops,
          timecard.costPerStop,
          timecard.drivingTotalCost,
        ]],
      });

      doc.moveDown(1);
    }

    // Miscellaneous Pay
    const miscAmount = getAmount(timecard.miscAmount);
    if (miscAmount > 0) {
      doc.table({
        title: 'Miscellaneous Pay',
        headers: ['Description', 'Amount', "Pay Code"],
        rows: [[timecard.miscDescription, timecard.miscAmount, timecard.miscPayCode]],
      });

      doc.moveDown(1);
    }

    // Paycode and Grand Total
    doc
      .fontSize(14)
      .text(`Grand Total: ${timecard.grandTotal}`, { underline: true, align: "right" });
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment");

  doc.end();
}