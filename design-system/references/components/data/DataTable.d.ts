/**
 * Data table with a rounded elevated header row and hairline row dividers.
 * @startingPoint section="Data" subtitle="Monitors / incidents table" viewport="700x300"
 */
export interface DataColumn {
  key: string;
  label: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  /** JetBrains Mono for hosts, IDs, durations */
  mono?: boolean;
  muted?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}
export interface DataTableProps {
  columns: DataColumn[];
  rows: any[];
  onRowClick?: (row: any) => void;
  /** Row id field, default "id" */
  rowKey?: string;
  dense?: boolean;
  emptyText?: string;
  /** Custom empty node (e.g. StateMessage with an existing action) */
  emptyState?: React.ReactNode;
  /** true or message → error row */
  error?: boolean | string;
  /** Shows a Retry button in the error row — only if retry is supported */
  onRetry?: () => void;
  /** Skeleton rows that mirror the columns */
  loading?: boolean;
  loadingRows?: number;
  /** Row key of the selected row (aria-selected + neon inset marker) */
  selectedKey?: string | number;
  /** Accessible name; makes the scroll container a focusable region */
  caption?: string;
  stickyHeader?: boolean;
  style?: React.CSSProperties;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
