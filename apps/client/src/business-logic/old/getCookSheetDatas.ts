import type { CookSheetInfo, CookSheetSectionRow } from "../../types/types";

export function getCookSheetDatas(
  cookSheetSections: CookSheetSectionRow[],
  cookSheetInfo: CookSheetInfo
) {
  const cookSheetDatas = [];

  for (const sectionInfo of cookSheetSections) {
    const { name, columns, footers } = sectionInfo;

    if (name === "carbs") {

    } else {
      const protein = name;

    }
  }
}