/** Compact dropdown — time ranges, regions, intervals. */
export interface SelectOption { value: string; label: string }
export interface SelectProps {
  options: Array<string | SelectOption>;
  value?: string;
  onChange?: (value: string) => void;
  /** Leading Lucide icon, e.g. "calendar" */
  icon?: string;
  label?: string;
  size?: 'sm' | 'md';
  /** Menu alignment */
  align?: 'left' | 'right';
  style?: React.CSSProperties;
}
export declare function Select(props: SelectProps): JSX.Element;
