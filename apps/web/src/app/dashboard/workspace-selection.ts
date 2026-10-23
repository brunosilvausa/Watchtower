import type { Workspace } from "@/lib/product-client";
export function authorizedSelection(rows: Workspace[], remembered: string | null): string {
  return rows.some(row => row.id === remembered) ? remembered! : rows[0]?.id ?? "";
}
export function workspacePreferenceKey(userId: string): string { return `watchtower.workspace.${userId}`; }
