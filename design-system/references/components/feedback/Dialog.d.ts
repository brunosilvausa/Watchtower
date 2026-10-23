/** Modal on a 72% black scrim. Esc and scrim click close. */
export interface DialogProps {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Footer buttons, right-aligned */
  actions?: React.ReactNode;
  onClose?: () => void;
  /** Max width px, default 480 */
  width?: number;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
