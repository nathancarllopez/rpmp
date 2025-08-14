import type { AllProteinInfo, FlavorInfoWithCalcs, OrderReportInfo, ProteinRow, StoreRow } from "../../types/types";

export function getBlankOrderReportInfo(
  proteinRows: ProteinRow[],
  proteinError: Error | null,
  // cookSheetSections: CookSheetSectionRow[],
  // cookError: Error | null,
): OrderReportInfo {
  if (proteinError) throw proteinError;
  // if (cookError) throw cookError;

  const proteinInfo: AllProteinInfo = proteinRows.reduce((info, row) => {
    const { name, flavors } = row;

    const flavorInfo = flavors.reduce((fInfo, fRow) => {
      const { name: flavor } = fRow;

      fInfo[flavor] = {
        ...fRow,
        orderedWeight: 0,
        weightToCook: 0,
        weightLbOz: "",
        cookedTeriyaki: null,
        sauce: null
      };

      return fInfo;
    }, {} as Record<string, FlavorInfoWithCalcs>)

    info[name] = {
      ...row,
      flavorInfo,
      totalWeightToCook: 0
    };

    return info;
  }, {} as AllProteinInfo);

  const initialInfo = {
    orders: [],
    orderErrors: [],
    usedBackstockIds: new Set<number>(),
    meals: [],
    stats: {
      numOrders: 0,
      numMeals: 0,
      numVeggieMeals: 0,
      numThankYouBags: 0,
      totalProteinWeight: 0,
      containers: {},
      proteins: {},
      veggieCarbs: {}
    },
    pullListInfo: {
      extraRoastedVeggies: 0,
      pullRows: []
    },
    shopSheetRows: new Map<string, StoreRow[]>(),
    cookSheetInfo: {
      numTeriyakiCuppies: 0,
      proteinCubes: {},
      carbsToCook: [],
    },
    // cookSheetSections,
    proteinInfo,
  }

  console.log(initialInfo);

  return initialInfo;
}

// export function getBlankOrderReportInfo(): OrderReportInfo {
//   return {
//     orders: [],
//     stats: {
//       orders: 0,
//       mealCount: 0,
//       veggieMeals: 0,
//       thankYouBags: 0,
//       totalProteinWeight: 0,
//       teriyakiCuppyCount: 0,
//       extraRoastedVeggies: 0,
//       proteinCubes: {},
//       containers: {},
//       proteins: {},
//       veggieCarbs: {},
//       carbsToCook: {}
//     },
//     orderErrors: [],
//     meals: [],
//     usedBackstockIds: new Set<number>(),
//     pullListDatas: [],
//     shopSheetDatas: new Map<string, ShopSheetDatas[]>(),
//     shopSheetRows: new Map<string, StoreRow[]>(),
//   };
// }