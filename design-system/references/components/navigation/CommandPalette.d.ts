/** ⌘K palette for jumping to existing pages and running existing actions. Overlay Z4, combobox + listbox semantics, focus restored on close. */
export interface CommandItem {
  id: string;
  label: string;
  /** Group heading, e.g. "Pages", "Monitors", "Actions" */
  group?: string;
  icon?: string;
  /** Right-aligned secondary text */
  hint?: string;
  shortcut?: string;
  /** Extra search terms */
  keywords?: string;
  onSelect?: () => void;
}
export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Existing destinations/actions only — never invent commands */
  items: CommandItem[];
  placeholder?: string;
  emptyText?: string;
}
export declare function CommandPalette(props: CommandPaletteProps): JSX.Element | null;
