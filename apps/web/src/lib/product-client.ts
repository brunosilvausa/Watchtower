export type ProductRow = Record<string, unknown> & { id: string };
export type Workspace = { id: string; name: string; role: string };
export type DashboardData = { workspace?: { id: string; name: string; plan: string }; summary: { observedChecks?: number; expectedChecks?: number; coveragePercent?: number | null; uptime: number | null; p95: number | null; openIncidents: number; mttr: number | null; checks: number }; monitors: ProductRow[]; incidents: ProductRow[]; channels: ProductRow[]; regions?: { region: string; checks: number; observedChecks: number; expectedChecks: number; coveragePercent: number | null; lastObservedAt: string | null; uptime: number | null; p95: number | null }[]; expiries?: { id: string; name: string; type: string; expiresAt: string; daysRemaining: number; observedAt: string; region: string }[]; trends?: ProductRow[]; deliveries?: ProductRow[]; usage: unknown; capabilities: unknown };
export async function productRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(path, { method, credentials: "same-origin", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  if (!payload || typeof payload !== "object" || !("data" in payload)) throw new Error("Invalid server response");
  return payload.data as T;
}
export function workspacePath(id: string, path: string) { return `/api/workspaces/${encodeURIComponent(id)}/${path}`; }
export function rowText(row: ProductRow, key: string): string { const value = row[key]; return value === null || value === undefined ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value); }
