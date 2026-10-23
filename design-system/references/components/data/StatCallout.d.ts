/** Big yellow number on bare canvas — the credibility moment. */
export interface StatCalloutProps {
  value: React.ReactNode;
  label?: React.ReactNode;
  /** md 40 · lg 56 (default) · xl 72 */
  size?: 'md' | 'lg' | 'xl';
  align?: 'left' | 'center';
  style?: React.CSSProperties;
}
export declare function StatCallout(props: StatCalloutProps): JSX.Element;
