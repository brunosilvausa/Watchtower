/** Black marketing footer with wordmark and link columns. */
export interface FooterColumn { title: string; links: string[] }
export interface FooterProps {
  columns?: FooterColumn[];
  note?: string;
  style?: React.CSSProperties;
}
export declare function Footer(props: FooterProps): JSX.Element;
