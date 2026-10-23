/**
 * Dark 40px text field. Focus turns the border yellow.
 * @startingPoint section="Forms" subtitle="Text, search, mono URL fields" viewport="700x320"
 */
export interface InputProps {
  label?: string;
  hint?: string;
  /** Error message; turns border rose */
  error?: string;
  /** Validated state — emerald border + check icon */
  valid?: boolean;
  /** Leading Lucide icon */
  icon?: string;
  /** Trailing keyboard hint, e.g. "⌘K" */
  kbd?: string;
  /** Trailing unit text, e.g. "ms" */
  suffix?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  /** Visible but not editable — dashed border, no well */
  readOnly?: boolean;
  /** Adds required + a neon asterisk */
  required?: boolean;
  id?: string;
  /** Use JetBrains Mono — for URLs, hosts, tokens */
  mono?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
