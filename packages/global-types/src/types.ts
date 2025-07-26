import { Constants, type Json } from "./database.types";
import type {
  Database,
  CamelCase,
  ToCamelCase,
  SupaProfileRow,
  SupaAllBackstockRow,
  SupaFlavorRow,
  SupaOrderHeaderRow,
  SupaOrderHistoryRow,
  SupaProteinRow,
  SupaProteinWithFlavorsRow,
  SupaPullListRow,
  SupaRoleInfoRow,
  SupaTimecardHistoryRow,
  SupaVeggieCarbInfoRow,
} from "./supa-types";

export type InsertSettingsRow =
  Database["public"]["Tables"]["settings"]["Insert"];

export const containerSizes = Constants["public"]["Enums"]["container_size"];

export type ContainerSize = Database["public"]["Enums"]["container_size"];
export type UpdateSettingsInfo =
  Database["public"]["Tables"]["settings"]["Update"];

export type ProfileRow = ToCamelCase<SupaProfileRow>;

export interface OrderStatistics {
  orders: number;
  mealCount: number;
  veggieMeals: number;
  thankYouBags: number;
  totalProteinWeight: number;
  teriyakiCuppyCount: number;
  extraRoastedVeggies: number;
  proteinCubes: Record<string, number>;
  containers: Partial<Record<ContainerSize, number>>;
  proteins: IngredientAmounts;
  veggieCarbs: IngredientAmounts;
}
export interface Order {
  fullName: string;
  itemName: string;
  container: ContainerSize;
  weight: number;
  flavor: string;
  flavorLabel: string;
  protein: string;
  proteinLabel: string;
  quantity: number;
}
export interface OrderError {
  error: Error | null;
  message: string;
  order: Order;
}
export interface IngredientAmounts {
  [name: string]: {
    label: string;
    amount: number;
    lbsPer: number;
    units: string;
  };
}
export interface Meal {
  protein: string;
  proteinLabel: string;
  flavor: string;
  flavorLabel: string;
  originalWeight: number;
  weight: number;
  weightLbOz: string;
  backstockWeight: number;
  cookedWeight: number;
  displayColor: string | null;
}
export interface PullListDatas {
  label: string;
  sunday: string;
  monday: string;
}

export interface GeneralSettings extends Record<string, Json> {}
export interface OrderSettings extends Record<string, Json> {
  skipEdits: boolean;
}
export interface BackstockSettings extends Record<string, Json> {}
export interface TimecardsSettings extends Record<string, Json> {}
export interface FinancesSettings extends Record<string, Json> {}
export interface MenuSettings extends Record<string, Json> {}
export interface EmployeesSettings extends Record<string, Json> {}
export interface SettingsRow {
  userId: string;
  general: GeneralSettings;
  orders: OrderSettings;
  backstock: BackstockSettings;
  timecards: TimecardsSettings;
  finances: FinancesSettings;
  menu: MenuSettings;
  employees: EmployeesSettings;
}

export type InsertBackstockRow =
  Database["public"]["Tables"]["backstock_proteins"]["Insert"];
export type InsertTimecardHistoryRow =
  Database["public"]["Tables"]["timecards_history"]["Insert"];
export type InsertOrderHistoryRow =
  Database["public"]["Tables"]["order_history"]["Insert"];
export type InsertProfileRow =
  Database["public"]["Tables"]["profiles"]["Insert"];

export type AllBackstockRow = ToCamelCase<SupaAllBackstockRow>;
export type FlavorRow = ToCamelCase<SupaFlavorRow>;
export type OrderHeaderRow = ToCamelCase<SupaOrderHeaderRow>;
export type ProteinRow = ToCamelCase<SupaProteinRow>;
export type ProteinWithFlavorsRow = ToCamelCase<SupaProteinWithFlavorsRow>;
export type RoleInfoRow = ToCamelCase<SupaRoleInfoRow>;
export type PullListRow = ToCamelCase<SupaPullListRow>;

export interface NewUserInfo {
  email: string;
  profileData: {
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    kitchenRate: number | null;
    drivingRate: number | null;
    displayColor: string | null;
  };
}

export interface SelectedBackstockRow extends AllBackstockRow {
  action: "edit" | "delete";
}
export interface UpdateBackstockInfo {
  [id: string]: {
    weight: number;
    created_at: string; // timestampz in supabase, new Date().toISOString() here
    deleted_on?: string | null; // Including this property performs a soft delete, i.e., it changes the column in the backstock table, and excluding it ignores that column. The string is a timestampz and null undoes the soft delete
  };
}

interface NavbarLinkInfo {
  id: string;
  label: string;
  href?: string;
}
export interface NavbarInfo extends NavbarLinkInfo {
  hasPermission: string[];
  icon: React.ReactNode;
  sublinks?: NavbarLinkInfo[];
}

export interface CreatedUserInfo {
  profile: ProfileRow;
  profilePicUrl: string;
  settings: SettingsRow;
}

export interface OrderReportInfo {
  orderData: Order[];
  stats: OrderStatistics;
  orderErrors: OrderError[];
  meals: Meal[];
  usedBackstockIds: Set<number>;
  pullListDatas: PullListDatas[];
}
export type OrderHistoryRow = {
  [K in keyof SupaOrderHistoryRow as CamelCase<K & string>]: K extends "data"
    ? OrderReportInfo
    : SupaOrderHistoryRow[K];
};

export interface ProteinWeights {
  [protein: string]: {
    [flavor: string]: {
      proteinLabel: string;
      flavorLabel: string;
      weight: number;
    };
  };
}
export type VeggieCarbInfoRow = {
  [K in keyof SupaVeggieCarbInfoRow as CamelCase<
    K & string
  >]: K extends "amounts"
    ? { [amount: number]: number }
    : SupaVeggieCarbInfoRow[K];
};

export interface TimecardValues extends ProfileRow {
  hasChanged: boolean;
  renderKey: number;

  profilePicUrl: string;

  drivingRate: number;
  kitchenRate: number;

  sundayStart: string;
  sundayEnd: string;
  sundayTotalHours: number;
  sundayOvertimeHours: number;
  sundayOvertimePay: number;
  sundayRegularPay: number;
  sundayTotalPay: number;

  mondayStart: string;
  mondayEnd: string;
  mondayTotalHours: number;
  mondayOvertimeHours: number;
  mondayOvertimePay: number;
  mondayRegularPay: number;
  mondayTotalPay: number;

  drivingStart: string;
  drivingEnd: string;
  drivingTotalHours: number;
  drivingOvertimeHours: number;
  drivingOvertimePay: number;
  drivingRegularPay: number;
  drivingTotalPay: number;
  costPerStop: number;
  drivingTotalCost: number;
  route1: number | "";
  route2: number | "";
  stops: number;

  miscDescription: string;
  miscAmount: number | "";
  miscPayCode: string;

  grandTotal: number;
}
// export type TimecardDisplayValues = {
//   [K in keyof TimecardValues]: string | null;
// };
export interface TimecardDisplayValues {
  fullName: string;

  kitchenRate: string;
  drivingRate: string;

  sundayStart: string;
  sundayEnd: string;
  sundayTotalHours: string;
  sundayOvertimeHours: string;
  sundayRegularPay: string;
  sundayOvertimePay: string;
  sundayTotalPay: string;

  mondayStart: string;
  mondayEnd: string;
  mondayTotalHours: string;
  mondayOvertimeHours: string;
  mondayRegularPay: string;
  mondayOvertimePay: string;
  mondayTotalPay: string;

  drivingStart: string;
  drivingEnd: string;
  drivingTotalHours: string;
  drivingOvertimeHours: string;
  drivingRegularPay: string;
  drivingOvertimePay: string;
  drivingTotalPay: string;
  route1: string;
  route2: string;

  stops: string;
  costPerStop: string;
  drivingTotalCost: string;

  miscAmount: string;
  miscDescription: string;
  miscPayCode: string;

  grandTotal: string;
}
export type TimecardHistoryRow = {
  [K in keyof SupaTimecardHistoryRow as CamelCase<K & string>]: K extends "data"
    ? TimecardValues[]
    : SupaTimecardHistoryRow[K];
};

export interface UpdatePullListInfo {
  idsToDelete: Set<number>;
  updates: PullListRow[];
}
