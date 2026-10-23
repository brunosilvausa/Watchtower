/** Small pill label for status, counts, and "NEW" emphasis. */
export interface BadgeProps {
  tone?: 'neutral' | 'yellow' | 'up' | 'down' | 'degraded' | 'info' | 'outline';
  /** Leading status dot in currentColor */
  dot?: boolean;
  /** Uppercase tracking — defaults true for yellow */
  uppercase?: boolean;
  shape?: 'pill' | 'square';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
