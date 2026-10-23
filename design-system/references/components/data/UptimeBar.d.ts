/** Day-by-day uptime history strip. */
export interface UptimeDay { status: 'up' | 'down' | 'degraded' | 'none'; label?: string }
export interface UptimeBarProps {
  /** Oldest → newest. Strings or {status,label}. */
  days: Array<'up' | 'down' | 'degraded' | 'none' | UptimeDay>;
  /** Bar height px, default 32 */
  height?: number;
  /** e.g. "99.98%" shown mid-axis */
  uptime?: string;
  startLabel?: string;
  endLabel?: string;
  style?: React.CSSProperties;
}
export declare function UptimeBar(props: UptimeBarProps): JSX.Element;
