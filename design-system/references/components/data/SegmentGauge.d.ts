/** Segmented bar meter (0–100) with a fading lit run. */
export interface SegmentGaugeProps {
  /** 0–100 */
  value: number;
  /** Number of bars, default 20 */
  segments?: number;
  tone?: 'primary' | 'up' | 'down' | 'degraded' | 'info';
  /** Bar height px, default 56 */
  height?: number;
  /** Show 0/25/50/75/100 scale */
  scale?: boolean;
  /** Fade lit bars from full to 25% */
  fade?: boolean;
  style?: React.CSSProperties;
}
export declare function SegmentGauge(props: SegmentGaugeProps): JSX.Element;
