import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Tilt } from "./motion";
import { iconPaths, type IconName } from "./icons";

export function Icon({ name, title, size = "md" }: { name: IconName; title?: string; size?: "sm" | "md" | "lg" }) {
  return <svg className={`ds-icon ds-icon-${size}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    {iconPaths[name].map((d, i) => <path key={i} d={d} />)}
  </svg>;
}
export type Tone = "neutral" | "yellow" | "up" | "down" | "degraded" | "info" | "outline";
export function Badge({ tone = "neutral", children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return <span className="ds-badge" data-tone={tone}>{dot && <span className="ds-dot" aria-hidden="true" />}{children}</span>;
}
export function StatusDot({ status, label }: { status: "up" | "down" | "degraded" | "info" | "neutral"; label: string }) {
  return <Badge tone={status} dot>{label}</Badge>;
}
export function Avatar({ name }: { name: string }) {
  return <span className="ds-avatar" role="img" aria-label={name}>{name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("") || "?"}</span>;
}
export type Material = "frosted" | "smoked" | "liquid" | "metal" | "solid" | "neon" | "overlay";
export interface CardProps extends HTMLAttributes<HTMLElement> { material?: Material; title?: string; eyebrow?: string; action?: ReactNode; icon?: IconName }
export function Card({ material = "frosted", title, eyebrow, action, icon, children, className = "", ...props }: CardProps) {
  return <section {...props} className={`ds-card wt-mat-${material} ${className}`}>
    {(title || eyebrow || action) && <header className="ds-card-header"><div>{eyebrow && <p className="wt-eyebrow">{eyebrow}</p>}{title && <h3 className="wt-card-title ds-card-title">{icon && <span className="ds-card-icon"><Icon name={icon} /></span>}{title}</h3>}</div>{action}</header>}
    {children}
  </section>;
}
export function StatCard({ label, value, unit, caption, featured = false, icon, className, material }: { label: string; value: ReactNode; unit?: string; caption?: string; featured?: boolean; icon?: IconName; className?: string; material?: Material }) {
  const card = <Card className={className} material={material}><p className="wt-label ds-stat-label">{icon && <span className="ds-card-icon"><Icon name={icon} /></span>}{label}</p><p className={featured ? "wt-value-xl" : "wt-value-lg"}>{value}<small className="wt-caption">{unit}</small></p>{caption && <p className="wt-caption">{caption}</p>}</Card>;
  return featured ? <Tilt>{card}</Tilt> : card;
}
export function StatCallout({ value, label }: { value: ReactNode; label: string }) {
  return <div><p className="wt-value-xl">{value}</p><p className="wt-caption">{label}</p></div>;
}
export function AmbientBackdrop({ children }: { children: ReactNode }) { return <div className="wt-ambient">{children}</div>; }
export function Skeleton({ label = "Loading", style }: { label?: string; style?: CSSProperties }) {
  return <div role="status" className="ds-skeleton" style={style}><span className="wt-sr-only">{label}</span></div>;
}
export function StateMessage({ title, children, action, error = false }: { title: string; children?: ReactNode; action?: ReactNode; error?: boolean }) {
  return <div className="ds-state" role={error ? "alert" : "status"}><strong>{title}</strong>{children && <p>{children}</p>}{action}</div>;
}
export function CodeWindow({ code, title = "Example configuration" }: { code: string; title?: string }) {
  return <figure className="ds-code"><figcaption>{title}</figcaption><pre tabIndex={0}><code>{code}</code></pre></figure>;
}
