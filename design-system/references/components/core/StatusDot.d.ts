/** Colored dot for a monitor's current state. */
export interface StatusDotProps {
  status?: 'up' | 'down' | 'degraded' | 'info' | 'paused';
  /** Pixel diameter, default 8 */
  size?: number;
  /** Static halo for live/attention states */
  pulse?: boolean;
  style?: React.CSSProperties;
}
export declare function StatusDot(props: StatusDotProps): JSX.Element;
