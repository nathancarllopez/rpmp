// import type {
//   AllProteinInfo,
//   CookSheetInfo,
//   CookSheetRow,
//   CookSheetSectionRow,
// } from "../../types/types";

// export function fillCookSheetRows(
//   proteinInfo: AllProteinInfo,
//   cookSheetInfo: CookSheetInfo,
//   cookSheetSections: CookSheetSectionRow[]
// ): Map<string, CookSheetRow[]> {
//   const rowsBySection = new Map<string, CookSheetRow[]>();

//   for (const section of cookSheetSections) {
//     const { name, label, columns } = section;
//     const { flavorInfo } = proteinInfo[name];

//     const cookRows = Object.values(flavorInfo)
//       .sort((a, b) => a.cookRow - b.cookRow)
//       .map((info) => {

//       });

//     rowsBySection.set(label);
//   }

//   return rowsBySection;
// }
