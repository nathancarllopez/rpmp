import type { ShopRowsByStore, ShopSheetDatas } from "../../types/types";

// To do: Change the keys of the output to be the store labels

export function getShopSheetDatas(
  shopSheetRows: ShopRowsByStore
): Map<string, ShopSheetDatas[]> {
  const shopSheetDatas = new Map<string, ShopSheetDatas[]>();
  const storeNames = shopSheetRows.keys();

  for (const storeName of storeNames) {
    const shopRows = shopSheetRows.get(storeName)!;

    const datas: ShopSheetDatas[] = shopRows.map((row) => ({
      ...row,
      purchaseLabel: row.purchaseLabel ?? "-",
      quantity: String(row.quantity),
      price: `$${row.price.toFixed(2)}`,
      locationInStore: row.locationInStore ?? "-",
    }));

    shopSheetDatas.set(storeName, datas);
  }

  return shopSheetDatas;
}
