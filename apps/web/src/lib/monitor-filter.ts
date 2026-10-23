import type { ProductRow } from "./product-client";
export function filterMonitors(rows: ProductRow[], query: string, state: string, type: string) {
  const search = query.trim().toLowerCase();
  return rows.filter(row => (state === "all" || (row.paused ? "paused" : row.state ?? "unknown") === state) && (type === "all" || row.type === type) && `${String(row.name ?? "")} ${String(row.target ?? "")}`.toLowerCase().includes(search));
}
