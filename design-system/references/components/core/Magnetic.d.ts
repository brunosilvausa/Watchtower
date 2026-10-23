/** Very subtle magnetic pull (≤5px) toward the pointer for a high-priority floating control. */
export interface MagneticProps {
  /** Max displacement in px, capped at 5. Default 4. */
  strength?: number;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Magnetic(props: MagneticProps): JSX.Element;
