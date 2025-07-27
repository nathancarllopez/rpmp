import { queryOptions } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { snakeToCamel } from "../../util/key-converters";
import type { OrderHistoryRow } from "../../types/types";

export function orderHistoryOptions() {
  return queryOptions({
    queryKey: ["orderHistory"],
    queryFn: getOrderHistory,
    staleTime: Infinity,
  });
}

async function getOrderHistory(): Promise<OrderHistoryRow[]> {
  const { data, error } = await supabase
    .from("order_history")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Failed to fetch order history");
    console.warn(error.message);

    throw error;
  }

  const orderHistory: OrderHistoryRow[] = data.map((row) =>
    snakeToCamel<OrderHistoryRow>(row)
  );

  return orderHistory;
}
