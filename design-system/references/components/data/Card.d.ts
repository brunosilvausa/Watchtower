/**
 * Container for dashboard widgets and marketing features. Frosted glass (Z1) by default.
 * @startingPoint section="Data" subtitle="Frosted, smoked, liquid, metal, and neon cards" viewport="700x320"
 */
export interface CardProps {
  /** Material. frosted (default, Z1; "glass"/"dark" are aliases) · elevated (frosted Z2) · smoked · liquid · metal · solid (opaque, for dense data) · flat (nested, no blur) · outline · yellow (neon) */
  variant?: 'frosted' | 'glass' | 'dark' | 'elevated' | 'smoked' | 'liquid' | 'metal' | 'solid' | 'flat' | 'outline' | 'yellow';
  /** md 16 · lg 24 (default, dashboards) · xl 32 (marketing features) · none */
  padding?: 'md' | 'lg' | 'xl' | 'none';
  title?: React.ReactNode;
  /** Lucide icon shown in a 32px glass disc before the title */
  icon?: string;
  /** Small uppercase label above title */
  eyebrow?: string;
  /** Right-aligned header slot — Select, IconButton, Button */
  action?: React.ReactNode;
  /** Pointer-responsive 3D tilt + lift + reactive light. true = "medium" (6°). Featured cards only — never on tables/charts/forms. */
  tilt?: boolean | 'subtle' | 'medium' | 'maximum';
  /** Hover lift (8px) + reactive light + edge illumination, no rotation. For clickable cards. */
  interactive?: boolean;
  /** Z-lift px while hovered. Default 20 (tilt) / 8 (interactive), max 20. */
  lift?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
