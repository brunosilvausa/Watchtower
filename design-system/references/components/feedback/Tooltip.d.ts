/** Hover/focus label on surface-elevated. */
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom';
  style?: React.CSSProperties;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
