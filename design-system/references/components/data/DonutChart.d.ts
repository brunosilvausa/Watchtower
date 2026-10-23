/** Ring chart with centered total and legend. */
export interface DonutSegment { label: string; value: number; color: string }
export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Centered headline, e.g. "24" */
  value?: React.ReactNode;
  /** Caption under value */
  label?: string;
  legend?: boolean;
  /** Value formatter for legend + centre on hover */
  format?: (v: number) => string | number;
  /** Accessible name; the full breakdown is announced */
  ariaLabel?: string;
  /** Shown when all segments are 0 */
  emptyText?: string;
  style?: React.CSSProperties;
}
export declare function DonutChart(props: DonutChartProps): JSX.Element;
