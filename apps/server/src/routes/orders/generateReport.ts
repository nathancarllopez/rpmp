import { Request, Response } from "express";
import PDFDocumentWithTables from "pdfkit-table";
import { containerSizes, Meal, Order, OrderError, OrderStatistics, PullListDatas } from "../../types/types";

export default async function generateReport(
  req: Request,
  res: Response
): Promise<void> {
  const { meals, orderData, orderErrors, stats, pullListDatas } = req.body;

  try {
    const report = new PDFDocumentWithTables({ layout: "landscape" });

    if (orderErrors.length > 0) {
      addErrors(report, orderErrors);
      report.addPage();
    }

    addSummary(report, stats);
    report.addPage();
    addOrders(report, orderData);
    report.addPage();
    addMeals(report, meals);
    report.addPage();
    addPullList(report, stats.mealCount, pullListDatas);
    // report.addPage({ layout: "portrait" });
    // addCookSheet(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment");

    report.pipe(res);
    report.end();
  } catch (error) {
    console.log("Error:");
    console.log(JSON.stringify(error));
  }
}

function addErrors(report: PDFDocumentWithTables, orderErrors: OrderError[]) {
  // Title
  report.fontSize(16).text("Errors", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  report.table({
    headers: [
      { label: "Full Name", property: "fullName", width: 100 },
      { label: "Order Info", property: "orderInfo", width: 250 },
      { label: "Issue", property: "issue", width: 250 },
    ],
    datas: orderErrors.map((oError) => {
      const { message, order } = oError;
      return {
        fullName: order.fullName,
        orderInfo: `${order.protein}: ${order.flavor} (${order.quantity})`,
        issue: message,
      };
    }),
  });
}

function addSummary(report: PDFDocumentWithTables, stats: OrderStatistics) {
  // Title
  report.fontSize(16).text("Sara's Numbers (Summary)", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  // Statistics
  report.table(
    {
      headers: [
        { label: "Total Orders", property: "orders" },
        { label: "Total Meals", property: "mealCount" },
        { label: "Total Veggie Meals", property: "veggieMeals" },
        { label: "Total Protein Weight", property: "totalProteinWeight" },
      ],
      datas: [
        {
          orders: stats.orders.toString(),
          mealCount: stats.mealCount.toString(),
          veggieMeals: stats.veggieMeals.toString(),
          totalProteinWeight: stats.totalProteinWeight.toString(),
        },
      ],
    },
    { title: "Statistics" }
  );
  report.moveDown();

  // Prepare the data for the proteins, veggieCarbs, and containers table
  // Determine how big the columns and how wide the padding between tables should be
  const { proteins, veggieCarbs } = stats;
  const verticalTablesTitles = {
    proteins: "Proteins",
    veggieCarbs: "Veggies and Carbs",
    containers: "Containers",
  };

  let dataWidths = {
    proteins: { label: 0, lbsPer: 0, amount: 0 },
    veggieCarbs: { label: 0, lbsPer: 0, amount: 0, total: 0 },
    containers: { label: 0, count: 0 },
  };

  const verticalTablesData = {
    proteins: Object.keys(proteins).reduce((pDatas, key) => {
      const data = proteins[key];
      if (data === undefined) return pDatas;

      const { label, lbsPer, amount } = data;

      dataWidths.proteins = {
        label: Math.max(dataWidths.proteins.label, getTextWidth(report, label)),
        lbsPer: Math.max(
          dataWidths.proteins.lbsPer,
          getTextWidth(report, String(lbsPer))
        ),
        amount: Math.max(
          dataWidths.proteins.amount,
          getTextWidth(report, String(amount))
        ),
      };

      pDatas.push({
        label,
        lbsPer: String(lbsPer),
        amount: String(amount),
      });

      return pDatas;
    }, [] as Record<string, string>[]),
    veggieCarbs: Object.keys(veggieCarbs).reduce((vcDatas, key) => {
      const data = veggieCarbs[key];
      if (data === undefined) return vcDatas;

      const { label, lbsPer, amount } = data;
      const total = String(lbsPer * amount);

      dataWidths.veggieCarbs = {
        label: Math.max(
          dataWidths.veggieCarbs.label,
          getTextWidth(report, label)
        ),
        lbsPer: Math.max(
          dataWidths.veggieCarbs.lbsPer,
          getTextWidth(report, String(lbsPer))
        ),
        amount: Math.max(
          dataWidths.veggieCarbs.amount,
          getTextWidth(report, String(amount))
        ),
        total: Math.max(
          dataWidths.veggieCarbs.total,
          getTextWidth(report, total)
        ),
      };

      vcDatas.push({
        label,
        lbsPer: String(lbsPer),
        amount: String(amount),
        total,
      });

      return vcDatas;
    }, [] as Record<string, string>[]),
    containers: containerSizes.reduce((contDatas, label) => {
      const count = String(stats.containers[label] || 0);

      dataWidths.containers = {
        label: Math.max(
          dataWidths.containers.label,
          getTextWidth(report, label)
        ),
        count: Math.max(
          dataWidths.containers.count,
          getTextWidth(report, count)
        ),
      };

      contDatas.push({ label, count });

      return contDatas;
    }, [] as Record<string, string>[]),
  };

  dataWidths = {
    proteins: {
      label: Math.max(dataWidths.proteins.label, 50),
      lbsPer: Math.max(dataWidths.proteins.lbsPer, 50),
      amount: Math.max(dataWidths.proteins.amount, 50),
    },
    veggieCarbs: {
      label: Math.max(dataWidths.veggieCarbs.label, 75),
      lbsPer: Math.max(dataWidths.veggieCarbs.lbsPer, 50),
      amount: Math.max(dataWidths.veggieCarbs.amount, 50),
      total: Math.max(dataWidths.veggieCarbs.total, 50),
    },
    containers: {
      label: Math.max(dataWidths.containers.label, 50),
      count: Math.max(dataWidths.containers.count, 50),
    },
  };

  const verticalTablesHeaders = {
    proteins: [
      { label: "Name", property: "label", width: dataWidths.proteins.label },
      {
        label: "Lbs Per",
        property: "lbsPer",
        width: dataWidths.proteins.lbsPer,
        align: "right",
      },
      {
        label: "Lbs Needed",
        property: "amount",
        width: dataWidths.proteins.amount,
        align: "right",
      },
    ],
    veggieCarbs: [
      { label: "Name", property: "label", width: dataWidths.veggieCarbs.label },
      {
        label: "Lbs Per",
        property: "lbsPer",
        width: dataWidths.veggieCarbs.lbsPer,
        align: "right",
      },
      {
        label: "# Units",
        property: "amount",
        width: dataWidths.veggieCarbs.amount,
        align: "right",
      },
      {
        label: "Total Lbs",
        property: "total",
        width: dataWidths.veggieCarbs.total,
        align: "right",
      },
    ],
    containers: [
      { label: "Name", property: "label", width: dataWidths.containers.label },
      { label: "Count", property: "count", width: dataWidths.containers.count },
    ],
  };

  const verticalTableWidths = {
    proteins: Object.values(dataWidths.proteins).reduce(
      (total, value) => total + value,
      0
    ),
    veggieCarbs: Object.values(dataWidths.veggieCarbs).reduce(
      (total, value) => total + value,
      0
    ),
    containers: Object.values(dataWidths.containers).reduce(
      (total, value) => total + value,
      0
    ),
  };
  const totalTableWidth = Object.values(verticalTableWidths).reduce(
    (total, value) => total + value,
    0
  );

  const pageWidth =
    report.page.width - report.page.margins.left - report.page.margins.right;
  // const paddingWidth = 0;
  const paddingWidth =
    (pageWidth - totalTableWidth) / (Object.keys(dataWidths).length - 1);

  // Draw the tables
  const tableY = report.y;
  let tableX = report.x;

  (["proteins", "veggieCarbs", "containers"] as const).forEach((key) => {
    report.table({
      title: verticalTablesTitles[key],
      headers: verticalTablesHeaders[key],
      datas: verticalTablesData[key],
    });

    tableX += verticalTableWidths[key] + paddingWidth;
    report.x = tableX;
    report.y = tableY;
  });
}

function addOrders(report: PDFDocumentWithTables, orders: Order[]) {
  // Title
  report.fontSize(16).text("Data (Orders)", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  // Orders
  report.table({
    headers: [
      { label: "Full Name", property: "fullName", width: 100 },
      { label: "Item Name", property: "itemName", width: 300 },
      { label: "Quantity", property: "quantity", width: 50, align: "center" },
      { label: "Protein", property: "proteinLabel", width: 75 },
      { label: "Flavor", property: "flavorLabel", width: 150 },
    ],
    datas: orders.map((order) => {
      return {
        ...order,
        quantity: order.quantity.toString(),
        weight: order.weight.toString(),
      };
    }),
  });
}

function addMeals(report: PDFDocumentWithTables, meals: Meal[]) {
  // Title
  report.fontSize(16).text("Summary (Meals)", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  // Meals
  const pageWidth =
    report.page.width - report.page.margins.left - report.page.margins.right;
  const columnWidths = {
    proteinLabel: pageWidth * 0.13,
    flavorLabel: pageWidth * 0.2,
    originalWeight: pageWidth * 0.13,
    weight: pageWidth * 0.13,
    backstockWeight: pageWidth * 0.13,
    cookedWeight: pageWidth * 0.13,
    weightLbOz: pageWidth * 0.13,
  };

  const mealTable = {
    headers: [
      {
        label: "Protein",
        property: "proteinLabel",
        width: columnWidths["proteinLabel"],
      },
      {
        label: "Flavor",
        property: "flavorLabel",
        width: columnWidths["flavorLabel"],
      },
      {
        label: "Original Weight (oz)",
        property: "originalWeight",
        align: "right",
        width: columnWidths["originalWeight"],
      },
      {
        label: "Weight (oz)",
        property: "weight",
        align: "right",
        width: columnWidths["weight"],
      },
      {
        label: "Backstock (oz)",
        property: "backstockWeight",
        align: "right",
        width: columnWidths["backstockWeight"],
      },
      {
        label: "Cooked Weight (oz)",
        property: "cookedWeight",
        align: "right",
        width: columnWidths["cookedWeight"],
      },
      {
        label: "Final Weight (lboz)",
        property: "weightLbOz",
        align: "right",
        width: columnWidths["weightLbOz"],
      },
    ],
    datas: meals.map((meal) => {
      const backstockWeight =
        meal.backstockWeight > 0 ? `${meal.backstockWeight} oz` : "-";

      return {
        ...meal,
        originalWeight: `${meal.originalWeight} oz`,
        weight: `${meal.weight} oz`,
        backstockWeight,
        cookedWeight: `${meal.cookedWeight} oz`,
        displayColor: meal.displayColor || "white",
      };
    }),
  };

  report.table(mealTable, {
    prepareRow(row, indexColumn, indexRow, rectRow, rectCell) {
      indexColumn === 0 &&
        (report as any).addBackground(rectRow, row.displayColor);
      return report;
    },
  });
}

function addPullList(report: PDFDocumentWithTables, mealCount: number, pullListDatas: PullListDatas[]) {
  // Title
  report;
  report.fontSize(16).text("Pull List", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  // Record total meals
  report.text(`Total meals: ${mealCount}`);

  // Generate the veggie table
  report.table({
    headers: [
      { label: "Name", property: "label" },
      { label: "Freezer Sunday", property: "sunday" },
      { label: "Freezer Monday", property: "monday" },
    ],
    datas: pullListDatas.map((item) => ({
      label: item.label,
      sunday: item.sunday,
      monday: item.monday,
    })),
  });
}

function addCookSheet(report: PDFDocumentWithTables) {
  // Title
  report;
  report.fontSize(16).text("Cook Sheet 1/3", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  report.table(
    {
      headers: ["", "", "", "", ""],
      rows: [
        ["1)", "Chicken (Purple)", "RAW", "", ""],
        ["", "GH Chicken", "0lbs8oz", "", ""],
        ["", "Total S.P.", "15lbs10oz", "COOKED:", "SAUCE:"],
      ],
    },
    { hideHeader: true }
  );
  report.addPage();

  // Title
  report.fontSize(16).text("Cook Sheet 2/3", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  report.table({});
  report.addPage();

  // Title
  report.fontSize(16).text("Cook Sheet 3/3", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  report.table({});
}

// For pull list, add the fish dethaw info from Sara's Numbers Sheet GAS script file

function getTextWidth(report: PDFDocumentWithTables, text: string) {
  return report.widthOfString(text);
}
