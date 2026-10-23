/** Smooth multi-series line/area chart with hover crosshair + tooltip. */
export interface LineSeries {
  name?: string;
  /** null/undefined = missing → rendered as a gap, never as 0 */
  data: Array<number | null>;
  /** CSS color — default var(--text-body). Use var(--primary) for the hero series. */
  color?: string;
  dashed?: boolean;
  /** Gradient area fill under the line */
  area?: boolean;
  width?: number;
}
export interface LineChartProps {
  series: LineSeries[];
  /** X-axis labels, same length as data */
  labels?: string[];
  /** Pixel height, default 240. Width fills container. */
  height?: number;
  min?: number;
  max?: number;
  /** Y gridline count, default 5 */
  ticks?: number;
  /** Value formatter for axis + tooltip */
  format?: (v: number) => string | number;
  /** Index to pin the crosshair */
  highlight?: number;
  onHighlight?: (index: number | null) => void;
  interactive?: boolean;
  /** Axis tick formatter (defaults to format) */
  formatAxis?: (v: number) => string | number;
  /** Show toggleable legend (≥2 named series) */
  legend?: boolean;
  loading?: boolean;
  /** true or message → error state */
  error?: boolean | string;
  emptyText?: string;
  /** Accessible chart name; captions the hidden data table */
  ariaLabel?: string;
  /** Left-to-right reveal on first render (off under reduced motion) */
  animate?: boolean;
  style?: React.CSSProperties;
}
export declare function LineChart(props: LineChartProps): JSX.Element;
