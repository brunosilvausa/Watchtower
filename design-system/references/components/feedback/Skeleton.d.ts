/** Structural loading placeholder. Decorative (aria-hidden) — the container must set aria-busy and a text label. */
export interface SkeletonProps {
  /** text (lines) · block · circle */
  variant?: 'text' | 'block' | 'circle';
  width?: number | string;
  /** Line height for text (default 12), block height (default 80), circle diameter */
  height?: number | string;
  /** Number of text lines; the last is shortened */
  lines?: number;
  radius?: string;
  style?: React.CSSProperties;
}
export declare function Skeleton(props: SkeletonProps): JSX.Element;
