/** Bar chart with zero baseline, negative values below the axis, optional muted comparison series, and dashed placeholders for missing values. */
export interface BarChartProps {
  /** One value per label. null = missing (dashed placeholder), never 0. */
  data: Array<number | null>;
  labels?: string[];
  /** Optional comparison series (muted), same length as data */
  comparison?: Array<number | null>;
  name?: string;
  comparisonName?: string;
  height?: number;
  min?: number;
  max?: number;
  ticks?: number;
  /** Tooltip + table formatter (currency, %, ms) */
  format?: (v: number) => string | number;
  formatAxis?: (v: number) => string | number;
  /** Bar colour — default light neutral (--chart-bar). The hovered/selected bar always lights neon. */
  color?: string;
  highlight?: number;
  onHighlight?: (index: number | null) => void;
  loading?: boolean;
  /** true or a message → error state */
  error?: boolean | string;
  emptyText?: string;
  /** Accessible chart name; also captions the screen-reader data table */
  ariaLabel?: string;
  /** Grow bars from the baseline on first render (off under reduced motion) */
  animate?: boolean;
  style?: React.CSSProperties;
}
export declare function BarChart(props: BarChartProps): JSX.Element;
