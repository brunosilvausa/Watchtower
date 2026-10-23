/**
 * Empty / unavailable / partial / error / success state with guidance and an optional existing action.
 * @startingPoint section="Feedback" subtitle="Empty, error, partial, success states" viewport="700x300"
 */
export interface StateMessageProps {
  /** empty = no data yet · unavailable = not applicable/not collected · partial = incomplete data · error = retrieval failed (role=alert) · success (role=status) */
  kind?: 'empty' | 'unavailable' | 'partial' | 'error' | 'success';
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Existing, supported actions only (e.g. Retry, Add monitor) */
  action?: React.ReactNode;
  /** Override the Lucide icon */
  icon?: string;
  /** Single-row layout for tables, charts and cards */
  compact?: boolean;
  style?: React.CSSProperties;
}
export declare function StateMessage(props: StateMessageProps): JSX.Element;
