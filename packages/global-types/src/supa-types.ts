import type { MergeDeep } from "type-fest";
import type { Database as GeneratedDatabase } from "./database.types";

export type Database = MergeDeep<
  GeneratedDatabase,
  {
    public: {
      Views: {
        all_backstock: {
          Row: {
            available: boolean;
            created_at: string;
            display_color: string | null
            id: number;
            is_protein: boolean;
            name: string;
            name_label: string;
            sub_name: string | null
            sub_name_label: string | null
            weight: number;
          }
        },
        proteins_with_flavors: {
          Row: {
            flavor_labels: string[];
            flavor_names: string[];
            protein_label: string;
            protein_name: string;
            flavors: {
              name: string,
              label: string,
            }[];
          }
        }
      }
    }
  }
>

export type SupaAllBackstockRow = Database["public"]["Views"]["all_backstock"]["Row"];
export type SupaFlavorRow = Database["public"]["Tables"]["flavors"]["Row"];
export type SupaInsertProfile = Database["public"]["Tables"]["profiles"]['Insert'];
export type SupaOrderHeaderRow = Database["public"]["Tables"]["order_headers"]["Row"];
export type SupaOrderHistoryRow = Database["public"]["Tables"]["order_history"]["Row"];
export type SupaProfileRow = Database['public']['Tables']['profiles']['Row'];
export type SupaProteinRow = Database["public"]["Tables"]["proteins"]["Row"];
export type SupaProteinWithFlavorsRow = Database["public"]["Views"]["proteins_with_flavors"]["Row"];
export type SupaPullListRow = Database["public"]["Tables"]["pull_list"]["Row"];
export type SupaRoleInfoRow = Database["public"]["Tables"]["role_info"]["Row"];
export type SupaTimecardHistoryRow = Database["public"]["Tables"]["timecards_history"]["Row"];
export type SupaVeggieCarbInfoRow = Database["public"]["Tables"]["veggie_carb_info"]["Row"];


export type CamelCase<S extends string> = S extends `${infer P}_${infer R}`
  ? `${P}${Capitalize<CamelCase<R>>}`
  : S;
export type ToCamelCase<T> = {
  [K in keyof T as CamelCase<K & string>]: T[K]
}