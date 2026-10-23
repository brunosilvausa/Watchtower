/** Transient notice — alert fired, monitor recovered, settings saved. */
export interface ToastProps {
  tone?: 'neutral' | 'up' | 'down' | 'degraded' | 'info';
  title: React.ReactNode;
  message?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
