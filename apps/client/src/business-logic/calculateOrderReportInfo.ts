import type { AllBackstockRow, IngredientAmounts, OrderReportInfo, ProteinRow, ProteinWeights, PullListRow, VeggieCarbInfoRow } from "@repo/global-types/types";
import { chooseBackstockWeights } from "./chooseBackstockWeights";

export function calculateOrderReportInfo(
  orderReportInfo: OrderReportInfo,
  proteinBackstock: AllBackstockRow[],
  veggieCarbBackstock: AllBackstockRow[],
  proteinInfo: Record<string, ProteinRow>,
  veggieCarbInfo: VeggieCarbInfoRow[],
  pullList: PullListRow[]
): OrderReportInfo {
  const { orderData } = orderReportInfo;
  const updatedInfo = { ...orderReportInfo };

  const orderCountByName: { [fullName: string]: number } = {};
  const proteinWeights: ProteinWeights = {};

  for (const order of orderData) {
    // Check for missing information, skip order if found
    // If the protein string is missing then the order is a veggie/carb only meal, so that doesn't count as 'missing'
    const missingInfo: string[] = [];
    for (const orderProp in order) {
      if (orderProp !== "protein" && !order[orderProp as keyof typeof order]) {
        missingInfo.push(orderProp);
      }
    }
    if (missingInfo.length > 0) {
      updatedInfo.orderErrors.push({
        error: null,
        message: `Order missing the following information: ${missingInfo}`,
        order,
      });
      continue;
    }

    // Extract the order information
    const {
      fullName,
      quantity,
      container,
      protein,
      weight,
      flavor,
      proteinLabel,
      flavorLabel,
    } = order;

    // Track the orders by name
    if (orderCountByName[fullName]) {
      orderCountByName[fullName] += quantity;
    } else {
      orderCountByName[fullName] = quantity;
    }

    // Update the meal and container count
    updatedInfo.stats.mealCount += quantity;
    if (!updatedInfo.stats.containers[container]) {
      updatedInfo.stats.containers[container] = 0;
    }
    updatedInfo.stats.containers[container] += quantity;
    if (
      flavor === "teriyaki" ||
      flavorLabel.toLowerCase().includes("teriyaki")
    ) {
      updatedInfo.stats.teriyakiCuppyCount += quantity;
    }

    // Skip ingredient calculations for pure veggie/carb meals
    if (!protein) {
      updatedInfo.stats.veggieMeals += quantity;
      continue;
    }

    // Calculate aggregate totals for each protein&flavor combo
    const aggWeight = weight * quantity;
    if (proteinWeights[protein]) {
      proteinWeights[protein][flavor] = {
        proteinLabel,
        flavorLabel,
        weight: aggWeight + (proteinWeights[protein][flavor]?.weight ?? 0),
      };
    } else {
      proteinWeights[protein] = {
        [flavor]: {
          proteinLabel,
          flavorLabel,
          weight: aggWeight,
        },
      };
    }
  }

  // Number of orders = number of unique names on order sheet
  // Number of thank you bags = 1 per 14 meals for each order
  updatedInfo.stats.orders = Object.keys(orderCountByName).length;
  updatedInfo.stats.thankYouBags = Object.values(orderCountByName).reduce(
    (count, orderCount) => {
      return count + Math.ceil(orderCount / 14);
    },
    0
  );

  // Make backstock adjustments for proteins and add to meals array
  const sortedProteins = Object.keys(proteinWeights).sort();
  for (const protein of sortedProteins) {
    const { shrink, displayColor } = proteinInfo[protein];
    const sortedFlavors = Object.keys(proteinWeights[protein]).sort();

    for (const flavor of sortedFlavors) {
      const originalWeight = proteinWeights[protein][flavor].weight;
      const backstockRows = chooseBackstockWeights(
        proteinBackstock,
        protein,
        flavor,
        originalWeight
      );

      let finalWeight = originalWeight;
      let backstockWeight = 0;
      if (backstockRows) {
        backstockRows.forEach((row) => {
          updatedInfo.usedBackstockIds.add(row.id);
          finalWeight -= row.weight;
          backstockWeight += row.weight;
        });
      }

      const shrinkMultiplier = 1 + shrink / 100;
      updatedInfo.meals.push({
        protein,
        proteinLabel: proteinWeights[protein][flavor].proteinLabel,
        flavor,
        flavorLabel: proteinWeights[protein][flavor].flavorLabel,
        originalWeight,
        weight: finalWeight,
        weightLbOz: getLbOzWeight(finalWeight),
        backstockWeight,
        cookedWeight: Number((finalWeight * shrinkMultiplier).toFixed(2)),
        displayColor,
      });

      proteinWeights[protein][flavor].weight = finalWeight;
    }
  }

  // Adjust salt and pepper based chicken recipes (protein: chicken, flavor: x)
  // Some of the chicken recipes use salt and pepper chicken as a base and just
  // add a sauce, so we can use extra salt and pepper backstock for those
  // recipes
  const orderHasChicken = Object.hasOwn(proteinWeights, "chicken");
  if (orderHasChicken) {
    const { shrink } = proteinInfo["chicken"];
    const chickenWeights = proteinWeights["chicken"];
    const spFlavors = ["sriracha", "bbq", "teriyaki"];

    for (const flavor of spFlavors) {
      if (
        !Object.hasOwn(chickenWeights, flavor) ||
        chickenWeights[flavor].weight === 0
      )
        continue;

      const mealToAdjustIdx = updatedInfo.meals.findIndex(
        (meal) => meal.protein === "chicken" && meal.flavor === flavor
      );
      if (mealToAdjustIdx === -1) continue;

      const unclaimedBackstock = proteinBackstock.filter((row) => {
        return (
          row.name === "chicken" &&
          row.subName === "x" &&
          !updatedInfo.usedBackstockIds.has(row.id)
        );
      });
      if (unclaimedBackstock.length === 0) continue;

      const originalWeight = chickenWeights[flavor].weight;
      const backstockRows = chooseBackstockWeights(
        unclaimedBackstock,
        "chicken",
        "x",
        originalWeight
      );
      if (!backstockRows) continue;

      let adjFinalWeight = updatedInfo.meals[mealToAdjustIdx].weight;
      let adjBackstockWeight =
        updatedInfo.meals[mealToAdjustIdx].backstockWeight;
      backstockRows.forEach((row) => {
        updatedInfo.usedBackstockIds.add(row.id);
        adjFinalWeight -= row.weight;
        adjBackstockWeight += row.weight;
      });

      const shrinkMultiplier = 1 + shrink / 100;
      updatedInfo.meals[mealToAdjustIdx] = {
        ...updatedInfo.meals[mealToAdjustIdx],
        weight: adjFinalWeight,
        weightLbOz: getLbOzWeight(adjFinalWeight),
        backstockWeight: adjBackstockWeight,
        cookedWeight: Number((adjFinalWeight * shrinkMultiplier).toFixed(2)),
      };
    }
  }

  // Aggregate proteins (converting to lbs) across flavors into stats.proteins
  for (const meal of updatedInfo.meals) {
    const { protein, weight, proteinLabel } = meal;
    const { lbsPer } = proteinInfo[protein];

    if (!Object.hasOwn(updatedInfo.stats.proteins, protein)) {
      updatedInfo.stats.proteins[protein] = {
        label: proteinLabel,
        amount: weight / 16,
        lbsPer,
        units: "lbs",
      };
    } else {
      const currentAmount = updatedInfo.stats.proteins[protein].amount;
      updatedInfo.stats.proteins[protein] = {
        ...updatedInfo.stats.proteins[protein],
        amount: currentAmount + weight,
      };
    }
  }

  // Split beefBison into beef and bison: client wants 1.25 pounds of bison for
  // every 10 pounds of beef. Also record the number of bison cubes
  const roundAtTensPlace = (weight: number) => 10 * Math.round(weight / 10);
  const { bisonCubes, beefWeight, bisonWeight } = (() => {
    const beefBison = updatedInfo.stats.proteins["beefBison"].amount;
    const roundedBeefBison = roundAtTensPlace(beefBison);

    const firstCubeCount = roundedBeefBison / 10;
    const firstBison = firstCubeCount * 1.25;
    const firstBeef = beefBison - firstBison;

    if (roundAtTensPlace(firstBeef) === roundedBeefBison) {
      return {
        bisonCubes: firstCubeCount,
        beefWeight: firstBeef,
        bisonWeight: firstBison,
      };
    }

    const bisonCubes = firstCubeCount - 1;
    const beefWeight = bisonCubes * 1.25;
    return {
      bisonCubes,
      beefWeight,
      bisonWeight: beefBison - beefWeight,
    };
  })();
  updatedInfo.stats.proteins["beef"] = {
    label: "Beef",
    amount: beefWeight,
    lbsPer: proteinInfo["beef"].lbsPer,
    units: "lbs",
  };
  updatedInfo.stats.proteins["bison"] = {
    label: "Bison",
    amount: bisonWeight,
    lbsPer: proteinInfo["bison"].lbsPer,
    units: "lbs",
  };
  delete updatedInfo.stats.proteins["beefBison"];

  // Add number of bison and turkey cubes
  const turkeyLbsPer = proteinInfo["turkey"].lbsPer;
  updatedInfo.stats.proteinCubes = {
    bison: bisonCubes,
    turkey: Math.ceil(
      updatedInfo.stats.proteins["turkey"].amount / turkeyLbsPer
    ),
  };

  // Add two pounds to sirloin to account for trimmed fat
  updatedInfo.stats.proteins["sirloin"].amount += 2;

  // Collect total protein weight for stats
  updatedInfo.stats.totalProteinWeight = Object.keys(
    updatedInfo.stats.proteins
  ).reduce((total, key) => {
    const { amount } = updatedInfo.stats.proteins[key];
    return total + amount;
  }, 0);

  // Add the starting veggie and carb data using stats.mealCount:
  // The amounts column contains how many units of each veggie and carb
  // should be used for each meal count threshold
  updatedInfo.stats.veggieCarbs = veggieCarbInfo.reduce((result, vcRow) => {
    const maxKey = Object.keys(vcRow.amounts).reduce(
      (max, curr) => Math.max(max, Number(curr)),
      0
    );
    const amountKey = Number(
      Object.keys(vcRow.amounts)
        .sort((a, b) => Number(a) - Number(b))
        .find((key) => Number(key) >= updatedInfo.stats.mealCount) || maxKey
    );
    const amount = vcRow.amounts[amountKey];

    result[vcRow.name] = {
      label: vcRow.label,
      amount,
      lbsPer: vcRow.lbsPer,
      units: vcRow.units,
    };
    return result;
  }, {} as IngredientAmounts);

  // Adjust the amount of roasted veggies from the amount of beefBison with the
  // fajita flavor: client wants an extra unit of roasted veggies per ten
  // pounds of beefBison fajita (rounded up)
  const beefBisonFajitaMeal = updatedInfo.meals.find(
    (meal) => meal.protein === "beefBison" && meal.flavor === "fajita"
  );
  if (beefBisonFajitaMeal) {
    const oldRoastedVeggies = updatedInfo.stats.veggieCarbs["roastedVeggies"];
    const oldAmount = oldRoastedVeggies.amount;
    const extra = Math.ceil(beefBisonFajitaMeal.originalWeight / 160);

    updatedInfo.stats.extraRoastedVeggies = extra;
    updatedInfo.stats.veggieCarbs = {
      ...updatedInfo.stats.veggieCarbs,
      roastedVeggies: {
        ...oldRoastedVeggies,
        amount: oldAmount + extra,
      },
    };
  }

  // Make backstock adjustments for veggies and carbs
  const veggieCarbKeys = Object.keys(updatedInfo.stats.veggieCarbs);
  for (const veggieCarb of veggieCarbKeys) {
    const { amount } = updatedInfo.stats.veggieCarbs[veggieCarb];

    // Client specified change: if there are more Yams in backstock than ordered this week, then it isn't cost effective to defrost the backstock Yams and not use the extra weight. But, not using backstock means buying 40 more lbs of Yams (they only come in that size) which could be even more costly. So, if there is a way to pull backstock so that the extra weight is at most 5 lbs, then they're willing to absorb that loss.
    const backstockRows =
      veggieCarb === "yams"
        ? chooseBackstockWeights(
            veggieCarbBackstock,
            veggieCarb,
            undefined,
            amount + 5
          )
        : chooseBackstockWeights(
            veggieCarbBackstock,
            veggieCarb,
            undefined,
            amount
          );

    if (backstockRows === null) continue;

    let afterBackstockAmount = amount;
    for (const row of backstockRows) {
      afterBackstockAmount -= row.weight;
      updatedInfo.usedBackstockIds.add(row.id);
    }

    updatedInfo.stats.veggieCarbs[veggieCarb].amount = afterBackstockAmount;
  }

  // Fill the pull list rows
  updatedInfo.pullListDatas = pullList
    .filter((row) => Object.hasOwn(updatedInfo.stats.veggieCarbs, row.name))
    .map((row) => {
      const { name, label, freezerMonday, freezerSunday } = row;
      const { amount } = updatedInfo.stats.veggieCarbs[name];

      if (name === "roastedVeggies") {
        return {
          label,
          sunday: updatedInfo.stats.extraRoastedVeggies.toString(),
          monday: String(amount - updatedInfo.stats.extraRoastedVeggies),
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

  return updatedInfo;
}

function getLbOzWeight(oz: number): string {
  const lbs = Math.floor(oz / 16);
  const remainingOz = Math.ceil(oz % 16);

  if (remainingOz === 16) {
    return lbs === 0 ? "1lb 0oz" : `${lbs + 1}lbs 0oz`;
  }

  return lbs === 1 ? `1lb ${remainingOz}oz` : `${lbs}lbs ${remainingOz}oz`;
}
