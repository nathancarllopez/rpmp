import PDFDocumentWithTables from "pdfkit-table";
import {
  AllProteinInfo,
  containerSizes,
  CookSheetInfo,
  // CookSheetSectionRow,
  Meal,
  Order,
  OrderError,
  OrderStatistics,
  PullListRow,
  StoreRow,
} from "../../types/types";

export function addCookSheetExplicit(
  report: PDFDocumentWithTables,
  cookSheetInfo: CookSheetInfo,
  proteinInfo: AllProteinInfo
) {
  const { carbsToCook, numTeriyakiCuppies, proteinCubes } = cookSheetInfo;

  // Title
  report.fontSize(16).text("Cook Sheet", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  // Chicken
  //#region
  const chickenProteinInfo = proteinInfo["chicken"];
  if (chickenProteinInfo === undefined) {
    throw new Error(`Could not find protein info for chicken`);
  }
  const chickenFlavorInfo = chickenProteinInfo.flavorInfo;

  const spFlavors = [
    { flavor: "sriracha", sauceMultiplier: 1.25 },
    { flavor: "bbq", sauceMultiplier: 2.5 },
    { flavor: "teriyaki", sauceMultiplier: 1.25 },
    { flavor: "saltAndPepper", sauceMultiplier: 0 },
  ];
  const totalSpWeight = spFlavors.reduce((weight, { flavor }) => {
    const flavorInfo = chickenFlavorInfo[flavor];
    if (flavorInfo === undefined) {
      throw new Error(`Could not find flavor info for ${flavor}`);
    }

    return weight + flavorInfo.weightToCook;
  }, 0);
  const totalSpLbOz = getLbOzWeight(totalSpWeight);

  const shrinkDivisor = 1.55; // Dividing by this gives weight after cooking
  const cookedAndSauceWeights = spFlavors.reduce(
    (weights, { flavor, sauceMultiplier }) => {
      const flavorInfo = chickenFlavorInfo[flavor];
      if (flavorInfo === undefined) {
        throw new Error(`Could not find flavor info for ${flavor}`);
      }

      const { weightToCook } = flavorInfo;
      const cookedWeight = weightToCook / shrinkDivisor;
      const sauceWeight = Math.round(10 * cookedWeight * sauceMultiplier) / 10;

      const cookedLbOz = getLbOzWeight(cookedWeight);
      const sauceOz = `${sauceWeight}oz`;

      weights[flavor] = { cookedLbOz, sauceOz };

      return weights;
    },
    {} as Record<string, { cookedLbOz: string; sauceOz: string }>
  );

  const chickenRows = [
    {
      flavor: "garlicHerb",
      label: "GH Chicken",
      includeCookedAndSauce: false,
    },
    {
      flavor: "lemonPepper",
      label: "LP Chicken",
      includeCookedAndSauce: false,
    },
    {
      flavor: "x",
      label: "X Chicken (Plain-Plain)",
      includeCookedAndSauce: false,
    },
    {
      flavor: "totalSp",
      label: "Total S.P.",
      includeCookedAndSauce: false,
    },
    {
      flavor: "sriracha",
      label: "SR Chicken",
      includeCookedAndSauce: true,
    },
    {
      flavor: "bbq",
      label: "BQ Chicken",
      includeCookedAndSauce: true,
    },
    {
      flavor: "teriyaki",
      label: "TK Chicken",
      includeCookedAndSauce: true,
    },
    {
      flavor: "saltAndPepper",
      label: "S.P. Chicken",
      includeCookedAndSauce: true,
    },
  ];
  report.table(
    {
      headers: [
        { label: "Name", property: "label" },
        { label: "Raw", property: "rawWeight" },
        { label: "Cooked", property: "cookedWeight" },
        { label: "Sauce", property: "sauceWeight" },
      ],
      datas: chickenRows.map(({ flavor, label, includeCookedAndSauce }) => {
        if (flavor === "totalSp") {
          return {
            label,
            rawWeight: totalSpLbOz,
            cookedWeight: "-",
            sauceWeight: "-",
          };
        }

        const flavorInfo = chickenFlavorInfo[flavor];
        if (flavorInfo === undefined) {
          throw new Error(`Could not find flavor info for ${flavor}`);
        }

        const { weightLbOz } = flavorInfo;
        if (includeCookedAndSauce) {
          const weightInfo = cookedAndSauceWeights[flavor];
          if (weightInfo === undefined) {
            throw new Error(`Could not find weight info for ${flavor}`);
          }
          const { cookedLbOz, sauceOz } = weightInfo;

          return {
            label,
            rawWeight: weightLbOz,
            cookedWeight: cookedLbOz,
            sauceWeight: sauceOz,
          };
        }

        return {
          label,
          rawWeight: weightLbOz,
          cookedWeight: "-",
          sauceWeight: "-",
        };
      }),
    },
    { title: "Chicken (Purple)" }
  );
  report.moveDown();
  //#endregion

  // Shrimp, Mahi-Mahi, and Salmon
  //#region
  const fishTableInfo = [
    {
      title: "Shrimp (Dark Red)",
      protein: "shrimp",
      fishData: [
        { flavor: "x", label: "X Shrimp (Plain-Plain)" },
        { flavor: "saltAndPepper", label: "S.P. Shrimp" },
        { flavor: "steakhouseShrimp", label: "SH Shrimp" },
        { flavor: "zestnLemon", label: "ZL Shrimp" },
        { flavor: "wildn", label: "W Shrimp" },
        { flavor: "teriyaki", label: "TK Shrimp" },
      ],
    },
    {
      title: "Mahi-Mahi (Orange)",
      protein: "mahiMahi",
      fishData: [
        { flavor: "garlicHerb", label: "GB Mahi-Mahi" },
        { flavor: "blackened", label: "BM Mahi-Mahi" },
        { flavor: "lemonPepper", label: "LP Mahi-Mahi" },
        { flavor: "teriyaki", label: "TK Mahi-Mahi" },
        { flavor: "saltAndPepper", label: "S.P. Mahi-Mahi" },
        { flavor: "x", label: "X Mahi-Mahi (Plain-Plain)" },
      ],
    },
    {
      title: "Salmon (Light Red)",
      protein: "salmon",
      fishData: [
        { flavor: "garlicHerb", label: "GB Salmon" },
        { flavor: "blackened", label: "BM Salmon" },
        { flavor: "lemonPepper", label: "LP Salmon" },
        { flavor: "teriyaki", label: "TK Salmon" },
        { flavor: "saltAndPepper", label: "S.P. Salmon" },
        { flavor: "x", label: "X Salmon (Plain-Plain)" },
      ],
    },
  ];

  fishTableInfo.forEach((info, index) => {
    report.table(
      {
        headers: [
          { label: "Name", property: "label" },
          { label: "Raw", property: "rawWeight" },
        ],
        datas: info.fishData.map(({ flavor, label }) => {
          const fishProteinInfo = proteinInfo[info.protein];
          if (fishProteinInfo === undefined) {
            throw new Error(`Could not find protein info for ${info.protein}`);
          }

          const flavorInfo = fishProteinInfo.flavorInfo[flavor];
          if (flavorInfo === undefined) {
            throw new Error(
              `Could not find flavor info for ${info.protein}-${flavor}`
            );
          }

          return {
            label,
            rawWeight: flavorInfo.weightLbOz,
          };
        }),
      },
      { title: info.title }
    );

    if (index !== fishTableInfo.length - 1) {
      report.moveDown();
    }
  });
  //#endregion

  report.addPage();

  // Turkey, Beef/Bison, and Sirloin
  //#region
  const birdCowTableInfo: {
    title: string;
    protein: string;
    birdCowData: {
      flavor: string;
      label: string;
      cookedTeriyakiFlavor: string | null;
    }[];
  }[] = [
    {
      title: "Turkey (Green)",
      protein: "turkey",
      birdCowData: [
        {
          flavor: "garlicHerb",
          label: "GH Turkey",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "spicyTurkey",
          label: "ST Turkey",
          cookedTeriyakiFlavor: "spicyTeriyakiTurkey",
        },
        {
          flavor: "lemonPepper",
          label: "LP Turkey",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "saltAndPepper",
          label: "S.P. Turkey",
          cookedTeriyakiFlavor: null,
        },
        { flavor: "teriyaki", label: "TK Turkey", cookedTeriyakiFlavor: null },
        {
          flavor: "x",
          label: "X Turkey (Plain-Plain)",
          cookedTeriyakiFlavor: null,
        },
      ],
    },
    {
      title: "Beef/Bison (Light Blue)",
      protein: "beefBison",
      birdCowData: [
        {
          flavor: "garlicHerb",
          label: "GH Beef",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "spicyBeefBison",
          label: "SB Beef",
          cookedTeriyakiFlavor: "spicyTeriyakiBeefBison",
        },
        {
          flavor: "saltAndPepper",
          label: "S.P. Beef",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "teriyaki",
          label: "TK Beef",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "fajita",
          label: "FB Beef",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "x",
          label: "X Beef (Plain-Plain)",
          cookedTeriyakiFlavor: null,
        },
      ],
    },
    {
      title: "Top Sirloin (Dark Blue)",
      protein: "sirloin",
      birdCowData: [
        {
          flavor: "twistedCajun",
          label: "TW Sirloin",
          cookedTeriyakiFlavor: "twistedTeriyaki",
        },
        {
          flavor: "steakhouseSirloin",
          label: "SH Sirloin",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "teriyaki",
          label: "TK Sirloin",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "saltAndPepper",
          label: "S.P. Sirloin",
          cookedTeriyakiFlavor: null,
        },
        {
          flavor: "x",
          label: "X Sirloin (Plain-Plain)",
          cookedTeriyakiFlavor: null,
        },
      ],
    },
  ];

  birdCowTableInfo.forEach((info, index) => {
    const numCubes = proteinCubes[info.protein];
    const title =
      numCubes === undefined
        ? info.title
        : `${info.title} - Cubes: ${numCubes}`;

    report.table(
      {
        headers: [
          { label: "Name", property: "label" },
          { label: "Raw", property: "rawWeight" },
          { label: "Cooked Teriyaki", property: "cookedTeriyaki" },
        ],
        datas: info.birdCowData.map(
          ({ flavor, label, cookedTeriyakiFlavor }) => {
            const birdCowProteinInfo = proteinInfo[info.protein];
            if (birdCowProteinInfo === undefined) {
              throw new Error(
                `Could not find protein info for ${info.protein}`
              );
            }

            const flavorInfo = birdCowProteinInfo.flavorInfo[flavor];
            if (flavorInfo === undefined) {
              throw new Error(
                `Could not find flavor info for ${info.protein}-${flavor}`
              );
            }
            const { weightLbOz } = flavorInfo;

            if (cookedTeriyakiFlavor) {
              const ctFlavorInfo =
                birdCowProteinInfo.flavorInfo[cookedTeriyakiFlavor];
              if (ctFlavorInfo === undefined) {
                throw new Error(
                  `Could not find flavor info for ${info.protein}-${cookedTeriyakiFlavor}`
                );
              }

              const flavorWeightToCook = flavorInfo.weightToCook;
              const ctWeightToCook = ctFlavorInfo.weightToCook;
              const combinedLbOz = getLbOzWeight(
                flavorWeightToCook + ctWeightToCook
              );

              return {
                label,
                rawWeight: combinedLbOz,
                cookedTeriyaki: ctFlavorInfo.weightLbOz,
              };
            }

            return {
              label,
              rawWeight: weightLbOz,
              cookedTeriyaki: "-",
            };
          }
        ),
      },
      { title: title }
    );

    if (index !== birdCowTableInfo.length - 1) {
      report.moveDown();
    }
  });
  //#endregion

  report.addPage();

  // Complex Carbs
  //#region
  report.table(
    {
      headers: [
        { label: "Name", property: "label" },
        { label: "To Cook", property: "amountWithUnits" },
        { label: "Water Amount", property: "water" },
      ],
      datas: carbsToCook.map((carb) => {
        const { label, amountWithUnits, note, water } = carb;

        if (note !== null) {
          return {
            label: note,
            amountWithUnits: "",
            water: "",
          };
        }

        if (water !== null) {
          return {
            label,
            amountWithUnits,
            water,
          };
        }

        return {
          label,
          amountWithUnits,
          water: "",
        };
      }),
    },
    { title: "Complex Carbohydrates (Yellow Tape)" }
  );

  report.moveDown();
  //#endregion

  // Egg Whites
  //#region
  const eggWhiteProteinInfo = proteinInfo["eggWhites"];
  if (eggWhiteProteinInfo === undefined) {
    throw new Error(`Could not find protein info for egg whites`);
  }

  const eggWhiteTableInfo = [
    { flavor: "saltAndPepper", cookLabel: "SP Egg Whites" },
    { flavor: "garlicHerb", cookLabel: "GH Egg Whites" },
    { flavor: "x", cookLabel: "X Egg Whites" },
    { flavor: "cageFreeCajun", cookLabel: "CJ Egg Whites" },
  ];

  report.table(
    {
      headers: [
        { label: "Name", property: "label" },
        { label: "Raw", property: "rawWeight" },
      ],
      datas: eggWhiteTableInfo.map(({ flavor, cookLabel }) => {
        const flavorInfo = eggWhiteProteinInfo.flavorInfo[flavor];
        if (flavorInfo === undefined) {
          throw new Error(
            `Could not find protein info for egg whites with flavor ${flavor}`
          );
        }

        return {
          label: cookLabel,
          rawWeight: `${flavorInfo.weightToCook}oz`,
        };
      }),
    },
    { title: "Egg Whites" }
  );

  report.moveDown();
  //#endregion

  report.text(`Teriyaki Cuppies: ${numTeriyakiCuppies} Cuppies`);
}

// export function addCookSheet(
//   report: PDFDocumentWithTables,
//   cookSheetSections: CookSheetSectionRow[],
//   cookSheetInfo: CookSheetInfo,
//   proteinInfo: AllProteinInfo
// ) {
//   const { carbsToCook, numTeriyakiCuppies, proteinCubes } = cookSheetInfo;

//   const tableData = cookSheetSections.map((row) => {
//     const { name, label, columns, pageBreakAfter } = row;

//     const datas = (() => {
//       if (name === "carbs") {
//         return carbsToCook
//           .sort((a, b) => a.displayOrder - b.displayOrder)
//           .map((carb) => {
//             return columns.reduce(
//               (row, { property }) => {
//                 if (!Object.hasOwn(carb, property)) {
//                   throw new Error(`Unexpected column: ${property}`);
//                 }

//                 const carbKey = property as keyof typeof carb;
//                 const value = carb[carbKey] as string | null;
//                 row[carbKey] = value ?? "-";

//                 return row;
//               },
//               {} as Record<keyof typeof carb, string>
//             );
//           });
//       }

//       const proteinInfoForName = proteinInfo[name];
//       if (proteinInfoForName === undefined) {
//         throw new Error(`Unexpected protein: ${name}`);
//       }

//       const { flavors, flavorInfo } = proteinInfoForName;
//       return flavors
//         .sort((a, b) => a.cookRow - b.cookRow)
//         .map((row) => {
//           const flavorInfoForName = flavorInfo[row.name];
//           if (flavorInfoForName === undefined) {
//             throw new Error(`Cannot find flavor info for: ${row.name}`);
//           }

//           return columns.reduce(
//             (dRow, { property }) => {
//               if (!Object.hasOwn(flavorInfoForName, property)) {
//                 throw new Error(`Unexpected column: ${property}`);
//               }

//               const flavorKey = property as keyof typeof flavorInfoForName;
//               const value = flavorInfoForName[flavorKey] as string | null;
//               dRow[property] = value ?? "-";

//               return dRow;
//             },
//             {} as Record<string, string>
//           );
//         });
//     })();

//     return {
//       name,
//       label,
//       headers: columns,
//       datas: datas,
//       pageBreakAfter,
//     };
//   });

//   // Title
//   report.fontSize(16).text("Cook Sheet", { align: "center" });

//   // Date in subtitle
//   report
//     .fontSize(10)
//     .text(new Date().toLocaleDateString(), { align: "center" });
//   report.moveDown();
//   report.fontSize(12);

//   tableData.forEach(({ name, label, headers, datas, pageBreakAfter }) => {
//     const numCubes = proteinCubes[name];
//     const title =
//       numCubes !== undefined ? `${label} - ${numCubes} Cubes` : label;

//     report.table(
//       {
//         headers: headers,
//         datas: datas,
//       },
//       { title: title }
//     );

//     if (pageBreakAfter) {
//       report.addPage();
//     } else {
//       report.moveDown();
//     }
//   });

//   report.text(`Teriyaki Cuppies: ${numTeriyakiCuppies} Cuppies`);
// }

export function addShopSheet(
  report: PDFDocumentWithTables,
  shopSheetRows: [string, StoreRow[]][]
) {
  // Title
  report.fontSize(16).text("Shop Sheet", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  const filteredShopRows: [string, StoreRow[]][] = shopSheetRows.map(([storeLabel, storeRows]) => {
    return [
      storeLabel,
      storeRows.filter((row) => row.quantity !== 0)
    ]
  });

  filteredShopRows.forEach(([storeLabel, storeRows]) => {
    if (storeLabel === "sysco") return;

    report.table(
      {
        headers: [
          { label: "Aisle #", property: "locationInStore" },
          { label: "Name", property: "label" },
          { label: "#", property: "quantity" },
          { label: "Purchase", property: "purchaseLabel" },
          { label: "Cost", property: "price" },
          { label: "Price Change", property: "priceChange" },
        ],
        datas: storeRows.map((row) => ({
          locationInStore: row.locationInStore ?? "-",
          label: row.label,
          quantity: row.quantity.toString(),
          purchaseLabel: row.purchaseLabel ?? "-",
          price: `$${row.price.toFixed(2)}`,
          priceChange: "",
        })),
      },
      { title: storeLabel }
    );
  });
}

export function addPullList(
  report: PDFDocumentWithTables,
  stats: OrderStatistics,
  pullListInfo: {
    extraRoastedVeggies: number;
    pullRows: PullListRow[];
  }
) {
  const { numMeals, veggieCarbs } = stats;
  const { extraRoastedVeggies, pullRows } = pullListInfo;

  // Title
  report.fontSize(16).text("Pull List", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  report.text(`Meal Count: ${numMeals}`);

  report.table({
    headers: [
      { label: "Name", property: "label" },
      { label: "Freezer Sunday", property: "sunday" },
      { label: "Freezer Monday", property: "monday" },
    ],
    datas: pullRows
      .filter((row) => Object.hasOwn(veggieCarbs, row.name))
      .map((row) => {
        const { name, label, freezerMonday, freezerSunday } = row;
        const { amount } = veggieCarbs[name]!;

        if (name === "roastedVeggies") {
          return {
            label,
            sunday: extraRoastedVeggies.toString(),
            monday: String(amount - extraRoastedVeggies),
          };
        }

        if (freezerSunday) {
          return {
            label,
            sunday: amount.toString(),
            monday: "",
          };
        }

        if (freezerMonday) {
          return {
            label,
            sunday: "",
            monday: amount.toString(),
          };
        }

        return { label, sunday: "", monday: "" };
      }),
  });
}

export function addMeals(report: PDFDocumentWithTables, meals: Meal[]) {
  // Title
  report.fontSize(16).text("Summary (Meals)", { align: "center" });

  // Date in subtitle
  report
    .fontSize(10)
    .text(new Date().toLocaleDateString(), { align: "center" });
  report.moveDown();
  report.fontSize(12);

  // Meals Info
  const mealTable = {
    headers: [
      {
        label: "Protein",
        property: "proteinLabel",
      },
      {
        label: "Flavor",
        property: "flavorLabel",
      },
      {
        label: "Ordered Weight",
        property: "orderedWeight",
        align: "right",
      },
      {
        label: "Backstock",
        property: "backstockWeight",
        align: "right",
      },
      {
        label: "Weight to Cook",
        property: "weightAfterBackstock",
        align: "right",
      },
      {
        label: "Raw Weight",
        property: "rawWeight",
        align: "right",
      },
      {
        label: "Final Weight",
        property: "finalWeight",
        align: "right",
      },
    ],
    datas: meals.map((meal) => {
      const backstockWeight =
        meal.backstockWeight > 0 ? `${meal.backstockWeight} oz` : "-";

      return {
        proteinLabel: meal.proteinLabel,
        flavorLabel: meal.flavorLabel,
        orderedWeight: `${meal.orderedWeight} oz`,
        backstockWeight,
        weightAfterBackstock: `${meal.weightAfterBackstock} oz`,
        rawWeight: `${meal.weightToCook.toFixed(2)} oz`,
        finalWeight: meal.weightLbOz,
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

export function addOrders(report: PDFDocumentWithTables, orders: Order[]) {
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

export function addErrors(
  report: PDFDocumentWithTables,
  orderErrors: OrderError[]
) {
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

export function addSummary(
  report: PDFDocumentWithTables,
  stats: OrderStatistics
) {
  // console.log('stats', stats);

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
        { label: "Total Orders", property: "numOrders" },
        { label: "Total Meals", property: "numMeals" },
        { label: "Total Veggie Meals", property: "numVeggieMeals" },
        { label: "Total Protein Weight", property: "totalProteinWeight" },
      ],
      datas: [
        {
          numOrders: stats.numOrders.toString(),
          numMeals: stats.numMeals.toString(),
          numVeggieMeals: stats.numVeggieMeals.toString(),
          totalProteinWeight: `${Math.ceil(stats.totalProteinWeight)}lbs`,
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
    proteins: Object.keys(proteins).reduce(
      (pDatas, key) => {
        const data = proteins[key];
        if (data === undefined) return pDatas;

        const { label, lbsPer, amount } = data;

        dataWidths.proteins = {
          label: Math.max(
            dataWidths.proteins.label,
            getTextWidth(report, label)
          ),
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
          amount: Math.ceil(amount).toString(),
        });

        return pDatas;
      },
      [] as Record<string, string>[]
    ),
    veggieCarbs: Object.keys(veggieCarbs).reduce(
      (vcDatas, key) => {
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
      },
      [] as Record<string, string>[]
    ),
    containers: containerSizes.reduce(
      (contDatas, label) => {
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
      },
      [] as Record<string, string>[]
    ),
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

function getTextWidth(report: PDFDocumentWithTables, text: string) {
  return report.widthOfString(text);
}

function getLbOzWeight(oz: number): string {
  const lbs = Math.floor(oz / 16);
  const remainingOz = Math.ceil(oz % 16);

  if (remainingOz === 16) {
    return lbs === 0 ? "1lb 0oz" : `${lbs + 1}lbs 0oz`;
  }

  return lbs === 1 ? `1lb ${remainingOz}oz` : `${lbs}lbs ${remainingOz}oz`;
}
