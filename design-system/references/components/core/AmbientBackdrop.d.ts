/** Diffused ambient light field behind glass layers, with gentle two-layer mouse parallax. */
export interface AmbientBackdropProps {
  /** Mouse parallax between light layers. Off under reduced motion. */
  parallax?: boolean;
  /** Light strength multiplier, default 1 */
  intensity?: number;
  /** "fixed" for full-page, "absolute" inside a positioned container */
  position?: 'fixed' | 'absolute';
  style?: React.CSSProperties;
}
export declare function AmbientBackdrop(props: AmbientBackdropProps): JSX.Element;
