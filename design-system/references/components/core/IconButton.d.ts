/** 36×36 icon-only button for toolbars and top bars. */
export interface IconButtonProps {
  /** Lucide icon name */
  icon: string;
  /** Accessible label (also tooltip) */
  label: string;
  variant?: 'dark' | 'ghost' | 'primary';
  shape?: 'circle' | 'square';
  /** Pixel size, default 36 */
  size?: number;
  /** Notification dot. true = yellow, or pass a CSS color */
  dot?: boolean | string;
  active?: boolean;
  /** ≤4px magnetic pull toward the pointer — floating / high-priority actions only. */
  magnetic?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
