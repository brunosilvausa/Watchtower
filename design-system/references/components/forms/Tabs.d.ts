/** Category / segmented tabs. Active = elevated surface + white text. */
export interface TabItem { value: string; label: string; count?: number }
export interface TabsProps {
  items: Array<string | TabItem>;
  value?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
