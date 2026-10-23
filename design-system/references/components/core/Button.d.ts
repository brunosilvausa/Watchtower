/**
 * Watchtower button. Yellow primary is the single action signal on any view.
 * @startingPoint section="Core" subtitle="Primary, secondary, outline, ghost, inverse, danger" viewport="700x260"
 */
export interface ButtonProps {
  /** primary = yellow CTA (one per view); inverse = black button on yellow bands. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse' | 'danger';
  /** sm 32px · md 40px (default) · lg 48px */
  size?: 'sm' | 'md' | 'lg';
  /** Lucide icon name before label */
  icon?: string;
  /** Lucide icon name after label */
  iconRight?: string;
  disabled?: boolean;
  /** Shows a spinner, sets aria-busy, and blocks clicks. */
  loading?: boolean;
  /** ≤4px magnetic pull toward the pointer. High-priority, non-destructive CTAs only. */
  magnetic?: boolean;
  fullWidth?: boolean;
  /** Renders an <a> when set */
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
