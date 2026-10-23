"use client";
import type { ReactNode } from "react";
import { Skeleton, StateMessage } from "./core";
import { Button } from "./actions";

export interface DataColumn<Row> { key: string; label: string; render: (row: Row) => ReactNode; mono?: boolean }
export function DataTable<Row extends { id: string }>({ columns, rows, caption, onRowClick, selectedKey, loading, error, onRetry }: { columns: DataColumn<Row>[]; rows: Row[]; caption: string; onRowClick?: (row: Row) => void; selectedKey?: string; loading?: boolean; error?: string; onRetry?: () => void }) {
  if (loading) return <Skeleton label={`Loading ${caption}`} />;
  if (error) return <StateMessage title="Unable to load data" error action={onRetry && <Button variant="secondary" onClick={onRetry}>Retry</Button>}>{error}</StateMessage>;
  return <div className="ds-table-scroll" role="region" aria-label={caption} tabIndex={0}><table><caption>{caption}</caption><thead><tr>{columns.map(column => <th scope="col" key={column.key}>{column.label}</th>)}{onRowClick && <th scope="col">Action</th>}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.id} data-selected={selectedKey === row.id || undefined}>{columns.map(column => <td key={column.key} className={column.mono ? "wt-code" : undefined}>{column.render(row)}</td>)}{onRowClick && <td><Button variant="ghost" size="sm" onClick={() => onRowClick(row)} aria-label={`Select ${row.id}`} aria-pressed={selectedKey === row.id}>Select</Button></td>}</tr>)}</tbody>
  </table>{!rows.length && <StateMessage title="No records yet" />}</div>;
}
