/** Pointer-responsive 3D tilt + lift + reactive glass light for ONE featured surface. Mouse only; static under reduced motion. */
export interface TiltProps {
  /** Rotation limit: preset or degrees (capped at 8). Default "medium" (6°). */
  max?: 'subtle' | 'medium' | 'maximum' | number;
  /** Z-lift in px while hovered, capped at 20. Default 20. */
  lift?: number;
  /** Specular + edge light intensity 0–1.5. Default 1. */
  reflection?: number;
  /** Spring preset or custom { stiffness, damping, mass }. Default "spatial". */
  spring?: 'gentle' | 'responsive' | 'spatial' | 'expressive' | { stiffness?: number; damping?: number; mass?: number };
  /** Border radius of the wrapped surface (for light layers). */
  radius?: string;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Tilt(props: TiltProps): JSX.Element;
