// import type { AllProteinInfo, CookSheetInfo } from "../../types/types";

// export function finalizeCookSheetData(
//   initialCookSheetInfo: CookSheetInfo,
//   initialProteinInfo: AllProteinInfo
// ): { cookSheetInfo: CookSheetInfo; proteinInfo: AllProteinInfo } {
//   const cookSheetInfo = { ...initialCookSheetInfo };

//   const { totalWeightToCook, lbsPer } = initialProteinInfo["turkey"];
//   const numTurkeyCubes = Math.ceil(totalWeightToCook / lbsPer);
//   cookSheetInfo.proteinCubes.turkey = numTurkeyCubes;

//   const proteinInfo: AllProteinInfo = {};
//   Object.entries(initialProteinInfo).forEach(([protein, initialInfo]) => {
//     const { flavors, flavorInfo } = initialInfo;
//     const info = { ...initialInfo };

//     switch(protein) {
//       case "chicken": {
//         const sauceFlavors = flavors.filter(({  }) => )

//         break;
//       }

//       case "sirloin":
//       case "beefBison":
//       case "turkey": {

//         break;
//       }

//       case "eggWhites": {

//         break;
//       }

//       default: {
//         console.log(protein);
//       }
//     }

//     proteinInfo[protein] = info;
//   });

//   return { cookSheetInfo, proteinInfo }
// }

// // To do:
// // Determine sauce amounts and cooked teriyaki amounts, and combine the rows

// // Client specified change: they want to cook all the non-rice carbs that they purchase
// // if (ingredientType === "carbs") {
// //   const amountToCook = name.toLowerCase().includes("rice")
// //     ? amount
// //     : quantityToPurchase * purchaseSize;

// //   carbsToCook[name] = {
// //     ...veggieCarbs[name],
// //     amount: amountToCook,
// //   };
// // }
