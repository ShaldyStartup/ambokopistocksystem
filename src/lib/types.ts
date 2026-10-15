export type Role = "staff" | "owner" | "manager";
export type Profile = { id: string; name: string; role: Role; active: boolean };
export type Category = { id: string; name: string; active: boolean };
export type Item = {
  id: string;
  name: string;
  category_id: string;
  category: { name: string } | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  notes: string;
  active: boolean;
  updated_at: string;
  updated_by: string | null;
};
export type RecordType =
  "stock_count" | "addition" | "reduction" | "correction" | "initial";
export type StockRecord = {
  id: string;
  inventory_item_id: string;
  record_type: RecordType;
  previous_quantity: number;
  new_quantity: number;
  quantity_change: number;
  shift_date: string | null;
  shift_label: string | null;
  notes: string | null;
  reason: string | null;
  created_at: string;
  recorded_by: string;
  item_name: string;
  unit: string;
  minimum_stock: number;
  category_name: string;
  recorder_name: string;
};
export type ActionResult = {
  error?: string;
  success?: string;
  fields?: Record<string, string[]>;
};
