/**
 * Dark code panel with window chrome, line numbers, light syntax tint, and status bar.
 * @startingPoint section="Data" subtitle="Code / terminal window" viewport="700x300"
 */
export interface CodeWindowProps {
  code: string;
  /** Filename or command shown in chrome */
  title?: string;
  /** Language tabs on the right of the chrome */
  tabs?: string[];
  activeTab?: string;
  onTab?: (tab: string) => void;
  lineNumbers?: boolean;
  /** Footer status text, e.g. "200 OK · 142ms" */
  status?: string;
  statusTone?: 'up' | 'down' | 'info';
  highlight?: boolean;
  style?: React.CSSProperties;
}
export declare function CodeWindow(props: CodeWindowProps): JSX.Element;
