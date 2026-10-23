/** Lucide outline glyph rendered as a CSS mask so it inherits currentColor. */
export interface IconProps {
  /** Lucide icon name, kebab-case (e.g. "activity", "bell", "shield-check"). */
  name: string;
  /** Pixel size. Default 18. */
  size?: number;
  /** Any CSS color. Default currentColor. */
  color?: string;
  /** Stroke in the 24-unit icon grid. Default keeps a constant 1.5px optical stroke at any size. */
  strokeWidth?: number;
  title?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
