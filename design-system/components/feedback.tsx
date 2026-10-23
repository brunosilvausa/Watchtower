"use client";
import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode, cloneElement, type HTMLAttributes } from "react";
import { IconButton } from "./actions";
import { type Tone } from "./core";

export function Dialog({ open, onClose, title, description, children, actions }: { open: boolean; onClose: () => void; title: string; description?: string; children?: ReactNode; actions?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) { if (dialog.open) dialog.close(); return; }
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return <dialog ref={ref} className="ds-dialog" onKeyDown={event => {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')).filter(node => !node.matches(":disabled") && node.tabIndex >= 0 && node.getClientRects().length > 0);
    const first = controls[0]; const last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}>
    <header className="ds-card-header"><h2 id={`${id}-title`} className="wt-section-heading">{title}</h2><IconButton icon="x" label="Close dialog" onClick={onClose} /></header>
    {description && <p id={`${id}-description`}>{description}</p>}{children}{actions && <footer className="ds-row">{actions}</footer>}
  </dialog>;
}
export function Toast({ title, children, tone = "info", onDismiss }: { title: string; children?: ReactNode; tone?: Tone; onDismiss?: () => void }) {
  return <div className="ds-toast wt-mat-overlay" role={tone === "down" ? "alert" : "status"} data-tone={tone}><div><strong>{title}</strong>{children && <p>{children}</p>}</div>{onDismiss && <IconButton icon="x" label="Dismiss notification" onClick={onDismiss} />}</div>;
}
export function Tooltip({ content, children }: { content: string; children: ReactElement<HTMLAttributes<HTMLElement>> }) {
  const id = useId(); const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false); const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <span className="ds-tooltip" data-dismissed={dismissed} data-hovered={hovered} onMouseEnter={() => { clearTimeout(timer.current); setDismissed(false); setHovered(true); }} onMouseLeave={event => {
    const duration = getComputedStyle(event.currentTarget).getPropertyValue("--motion-fast").trim();
    // Allow diagonal pointer travel from the trigger to its wider tooltip.
    timer.current = setTimeout(() => setHovered(false), parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000));
  }} onFocus={() => setDismissed(false)} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setDismissed(true); } }}>
    {cloneElement(children, { "aria-describedby": [children.props["aria-describedby"], id].filter(Boolean).join(" ") })}<span id={id} role="tooltip">{content}</span>
  </span>;
}
