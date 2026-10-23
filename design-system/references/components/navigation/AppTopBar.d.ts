/** App header row: current user chip, ⌘K search, right-hand actions. */
export interface AppTopBarProps {
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  /** Right slot — IconButtons, Buttons */
  actions?: React.ReactNode;
  user?: { name: string; role?: string };
  /** Page location, last item is the current page */
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  /** Optional page title under the breadcrumbs */
  title?: string;
  /** When set, search renders as a button that opens the CommandPalette */
  onCommand?: () => void;
  /** Shortcut label, default "⌘K" */
  shortcut?: string;
  /** Shows a menu button (mobile drawer) */
  onMenu?: () => void;
  style?: React.CSSProperties;
}
export declare function AppTopBar(props: AppTopBarProps): JSX.Element;
