import type { ContainerSize, Order } from "../types/types";

export function cleanParsedOrderData(
  rows: Record<string, string>[],
  headerMapping: { [name: string]: { label: string; rawLabel: string } },
  flavorMapping: { [rawLabel: string]: { flavor: string; flavorLabel: string } }
): {
  orderData: Order[];
  cleaningErrors: Record<string, string>[];
} {
  const orderData: Order[] = [];
  const cleaningErrors: Record<string, string>[] = [];

  if (rows.length === 0) {
    cleaningErrors.push({
      noRowsPassed: "",
    });
    return { orderData, cleaningErrors };
  }

  const firstRow = rows[0];
  const requiredHeaders = Object.values(headerMapping).map(
    ({ rawLabel }) => rawLabel
  );

  for (const header of requiredHeaders) {
    if (!firstRow.hasOwnProperty(header)) {
      cleaningErrors.push({
        missingHeader: header,
      });
    }
  }

  if (cleaningErrors.length > 0) {
    return { orderData, cleaningErrors };
  }

  const filtered: Record<string, string>[] = rows.filter(() => true);
  filtered.forEach((row) => {
    const fullName =
      row[headerMapping.firstName.rawLabel] +
      " " +
      row[headerMapping.lastName.rawLabel];

    const itemName = row[headerMapping.itemName.rawLabel];
    const quantity = parseInt(row[headerMapping.quantity.rawLabel]);
    const { container, weight, issue } = getContainerAndWeight(
      itemName,
      quantity
    );

    if (container === null || weight === null) {
      cleaningErrors.push({
        containerOrWeight: issue || "",
      });
      return;
    }

    const rawFlavorText = row[headerMapping.flavor.rawLabel];
    const rawFlavorLabel = (() => {
      if (rawFlavorText === "" || rawFlavorText === "100% PLAIN-PLAIN") {
        return "COMPETITOR-PREP (100% PLAIN-PLAIN)";
      }
      if (rawFlavorText === "SPICY BISON") {
        return "SPICY BEEF BISON";
      }
      return rawFlavorText;
    })();
    const { flavor, flavorLabel } = flavorMapping[rawFlavorLabel];

    const proteinLabel = row[headerMapping.protein.rawLabel];
    const protein = (() => {
      switch (proteinLabel) {
        case "Beef Bison":
        case "Egg Whites":
        case "Mahi Mahi": {
          const [first, second] = proteinLabel.split(" ");
          return first.toLowerCase() + second;
        }

        default: {
          return proteinLabel.toLowerCase();
        }
      }
    })();

    orderData.push({
      fullName,
      itemName,
      container,
      weight,
      flavor,
      flavorLabel,
      protein,
      proteinLabel,
      quantity,
    });
  });

  return { orderData, cleaningErrors };
}

function getContainerAndWeight(
  itemName: string,
  quantity: number
): {
  container: ContainerSize | null;
  weight: number | null;
  issue: string | null;
} {
  // Captures, e.g., "2 lbs", "4.5oz", "3lb", and "17 oz"
  const pattern = /\b(\d+(\.\d+)?)\s?(lb|lbs|oz)\b/i;
  const matches = itemName.match(pattern);

  if (!matches) {
    console.log("Could not extract container size from item name");
    return {
      container: null,
      weight: null,
      issue: "Could not extract container size from item name",
    };
  }

  const match = matches[0].replace(" ", "").toLowerCase();
  if (match.includes("lb")) {
    const weightInOz =
      16 * parseFloat(match.replace("lbs", "").replace("lb", ""));
    return {
      container: "bulk",
      weight: weightInOz * quantity,
      issue: null,
    };
  } else if (["2.5oz", "4oz", "6oz", "8oz", "10oz"].includes(match)) {
    const weight = parseFloat(match.replace("oz", ""));
    return {
      container: match as ContainerSize,
      weight: weight * quantity,
      issue: null,
    };
  }

  console.log(`Unexpected container size: ${match}`);
  return {
    container: null,
    weight: null,
    issue: `Unexpected container size: ${match}`,
  };
}