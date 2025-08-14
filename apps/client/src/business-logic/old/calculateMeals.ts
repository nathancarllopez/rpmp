import type {
  AllBackstockRow,
  FlavorRow,
  Meal,
  Order,
  OrderError,
  ProteinRow,
  ProteinWeights,
} from "../../types/types";
import { chooseBackstockWeights } from "../orders/chooseBackstockWeights";

export default function calculateMeals(
  orders: Order[],
  proteinBackstock: AllBackstockRow[],
  proteinInfo: Record<string, ProteinRow>,
  flavorInfo: Record<string, FlavorRow>
): {
  orderErrors: OrderError[];
  usedBackstockIds: Set<number>;
  meals: Meal[];
} {
  const orderErrors: OrderError[] = [];
  const usedBackstockIds: Set<number> = new Set();
  const proteinWeights: ProteinWeights = {};

  // Aggregate orders into proteinWeights by protein and then flavor
  for (const order of orders) {
    // Extract the order information
    const { quantity, protein, weight, flavor, proteinLabel, flavorLabel } =
      order;

    // Skip ingredient calculations for pure veggie/carb meals
    // To do: Revisit this with the client. Where should this data go?
    if (protein === "") continue;

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

  console.log(proteinWeights);

  // Create the meals array
  const initialMeals: Meal[] = [];
  const sortedProteins = Object.keys(proteinWeights).sort();
  for (const protein of sortedProteins) {
    const { displayColor, shrink } = proteinInfo[protein];
    const shrinkMultiplier = 1 + shrink / 100;
    const sortedFlavors = Object.keys(proteinWeights[protein]).sort();

    for (const flavor of sortedFlavors) {
      const { proteinLabel, flavorLabel, weight } =
        proteinWeights[protein][flavor];

      const finalWeight = weight * shrinkMultiplier;
      initialMeals.push({
        protein,
        proteinLabel,
        flavor,
        flavorLabel,
        orderedWeight: weight,
        weightAfterBackstock: weight,
        finalWeight,
        weightLbOz: getLbOzWeight(finalWeight),
        backstockWeight: 0,
        displayColor,
      });
    }
  }

  console.log('initialMeals', initialMeals);

  // Use backstock to offset the amount needed to cook by matching protein and flavor exactly
  const firstAdjustment = initialMeals.map((meal) => {
    const { protein, flavor, orderedWeight } = meal;
    const backstockRows = chooseBackstockWeights(
      proteinBackstock,
      protein,
      flavor,
      orderedWeight
    );

    if (backstockRows === null) return meal;

    let weightAfterBackstock = orderedWeight;
    let backstockWeight = 0;
    backstockRows.forEach((row) => {
      usedBackstockIds.add(row.id);
      weightAfterBackstock -= row.weight;
      backstockWeight += row.weight;
    });

    const { shrink } = proteinInfo[protein];
    const shrinkMultiplier = 1 + shrink / 100;
    const finalWeight = weightAfterBackstock * shrinkMultiplier;

    return {
      ...meal,
      weightAfterBackstock,
      finalWeight,
      weightLbOz: getLbOzWeight(finalWeight),
      backstockWeight,
    }
  });

  console.log('firstAdjustment', firstAdjustment);

  // Use backstock to offset the amount as above, except use base flavors this time
  const meals: Meal[] = firstAdjustment.map((meal) => {
    const { protein, flavor } = meal;
    const { baseFlavor } = flavorInfo[flavor];

    if (meal.finalWeight === 0 || baseFlavor === null) return meal;

    const matchingBackstock = proteinBackstock.filter(
      (row) =>
        !usedBackstockIds.has(row.id) &&
        row.name === protein &&
        row.subName === flavor
    );

    const backstockRows = chooseBackstockWeights(matchingBackstock, protein, baseFlavor, meal.weightAfterBackstock);

    if (backstockRows === null) return meal;

    let weightAfterBackstock = meal.weightAfterBackstock;
    let backstockWeight = meal.backstockWeight;
    backstockRows.forEach((row) => {
      usedBackstockIds.add(row.id);
      weightAfterBackstock -= row.weight;
      backstockWeight += row.weight;
    });

    const { shrink } = proteinInfo[protein];
    const shrinkMultiplier = 1 + shrink / 100;
    const finalWeight = weightAfterBackstock * shrinkMultiplier;

    return {
      ...meal,
      weightAfterBackstock,
      finalWeight,
      weightLbOz: getLbOzWeight(finalWeight),
      backstockWeight,
    }
    
  });

  console.log('meals:', meals)

  return { orderErrors, meals, usedBackstockIds };
}

function getLbOzWeight(oz: number): string {
  const lbs = Math.floor(oz / 16);
  const remainingOz = Math.ceil(oz % 16);

  if (remainingOz === 16) {
    return lbs === 0 ? "1lb 0oz" : `${lbs + 1}lbs 0oz`;
  }

  return lbs === 1 ? `1lb ${remainingOz}oz` : `${lbs}lbs ${remainingOz}oz`;
}