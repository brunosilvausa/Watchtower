/** Marketing top nav — 64px black bar, wordmark, links, Sign in + yellow CTA. */
export interface TopNavProps {
  links?: string[];
  active?: string;
  onNav?: (link: string) => void;
  onSignIn?: () => void;
  onCta?: () => void;
  ctaLabel?: string;
  style?: React.CSSProperties;
}
export declare function TopNav(props: TopNavProps): JSX.Element;
