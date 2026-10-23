/** KPI tile: uppercase label, big value, trend line. */
export interface StatCardProps {
  /** primary (frosted glass, Z1) · secondary (quiet nested surface, smaller value). Featured overrides to primary. */
  emphasis?: 'primary' | 'secondary';
  /** Supporting sparkline data (null = gap) */
  trend?: Array<number | null>;
  /** Accessible name for the sparkline */
  trendLabel?: string;
  /** Skeleton matching the card layout */
  loading?: boolean;
  /** Value not available/applicable. true or a reason string. Renders "—", never 0. Also triggered when value is null. */
  unavailable?: boolean | string;
  /** Makes the card a button with 8px hover lift */
  onClick?: () => void;
  label: string;
  /** Lucide icon in a hairline ring */
  icon?: string;
  value?: React.ReactNode | null;
  /** Unit after value, e.g. "ms" */
  unit?: string;
  /** Delta text, e.g. "12%" */
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  /** Override color meaning (latency up = bad) */
  deltaTone?: 'up' | 'down' | 'neutral';
  caption?: string;
  /** Mouse-responsive 3D tilt + 16px lift */
  featured?: boolean;
  /** Render value in yellow with soft neon glow — one per row max */
  highlight?: boolean;
  style?: React.CSSProperties;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
