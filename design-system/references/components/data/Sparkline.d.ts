/** Tiny trend line for metric cards and table cells. Missing values (null) render as gaps. */
export interface SparklineProps {
  /** Oldest → newest. null = missing (gap), never treated as 0. */
  data: Array<number | null>;
  width?: number;
  height?: number;
  color?: string;
  area?: boolean;
  /** Accessible summary, e.g. "p95 latency, last 7 days, trending down" */
  ariaLabel?: string;
  style?: React.CSSProperties;
}
export declare function Sparkline(props: SparklineProps): JSX.Element;
