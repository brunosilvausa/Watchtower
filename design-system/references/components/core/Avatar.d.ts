/** Circular member avatar — image or initials. */
export interface AvatarProps {
  name?: string;
  src?: string;
  /** Pixel size, default 32 */
  size?: number;
  style?: React.CSSProperties;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
