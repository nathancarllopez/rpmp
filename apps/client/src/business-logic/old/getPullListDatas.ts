import type {
  OrderStatistics,
  PullListDatas,
  PullListRow,
} from "../../types/types";

export function getPullListDatas(
  stats: OrderStatistics,
  pullTemplateRows: PullListRow[],
): PullListDatas[] {
  return pullTemplateRows
    .filter((row) => Object.hasOwn(stats.veggieCarbs, row.name))
    .map((row) => {
      const { name, label, freezerMonday, freezerSunday } = row;
      const { amount } = stats.veggieCarbs[name];

      if (name === "roastedVeggies") {
        return {
          label,
          sunday: stats.extraRoastedVeggies.toString(),
          monday: String(amount - stats.extraRoastedVeggies),
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
    });
}
