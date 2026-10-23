/**
 * App sidebar: wordmark, workspace switcher, sectioned nav.
 * @startingPoint section="Navigation" subtitle="App sidebar with workspace switcher" viewport="700x520"
 */
export interface SidebarItem { id: string; label: string; icon: string; badge?: React.ReactNode; badgeTone?: 'neutral' | 'down' }
export interface SidebarSection { label?: string; items: SidebarItem[] }
export interface SidebarProps {
  /** Current tenant workspace */
  workspace?: { name: string; plan?: string; onClick?: () => void };
  sections: SidebarSection[];
  active?: string;
  onSelect?: (id: string) => void;
  /** Bottom slot — upgrade card, user row */
  footer?: React.ReactNode;
  /** Icon-only rail (76px). Labels move to aria-label/title, badges become dots. */
  collapsed?: boolean;
  /** Renders a collapse/expand control */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Landmark label, default "Main" */
  label?: string;
  style?: React.CSSProperties;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
