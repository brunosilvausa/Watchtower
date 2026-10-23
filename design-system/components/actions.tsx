"use client";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./core";
import type { IconName } from "./icons";
import { Magnetic } from "./motion";

type ButtonStyle = { variant?: "primary" | "secondary" | "outline" | "ghost" | "inverse" | "danger"; size?: "sm" | "md" | "lg"; loading?: boolean; disabled?: boolean; icon?: IconName; magnetic?: boolean; children: ReactNode };
type ButtonProps = ButtonStyle & ((ButtonHTMLAttributes<HTMLButtonElement> & { href?: never }) | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }));
export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", loading, disabled, icon, magnetic, children, className = "", ...rest } = props;
  const inert = Boolean(disabled || loading);
  const classes = `ds-button ds-button-${variant} ds-button-${size} ${className}`;
  const content = <>{loading ? <span className="ds-spinner" aria-hidden="true" /> : icon && <Icon name={icon} size="sm" />}{children}</>;
  let control;
  if ("href" in rest && typeof rest.href === "string") {
    const { onClick, href, ...linkProps } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    control = <a {...linkProps} href={inert ? undefined : href} role={inert ? "link" : undefined} tabIndex={inert ? -1 : linkProps.tabIndex} className={classes} aria-disabled={inert || undefined} aria-busy={loading || undefined} onClick={event => { if (inert) event.preventDefault(); else onClick?.(event); }}>{content}</a>;
  } else {
    const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    control = <button {...buttonProps} type={buttonProps.type ?? "button"} className={classes} disabled={inert} aria-busy={loading || undefined}>{content}</button>;
  }
  return magnetic && variant !== "danger" && !inert ? <Magnetic>{control}</Magnetic> : control;
}
export function IconButton({ icon, label, active, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { icon: IconName; label: string; active?: boolean }) {
  return <button {...props} type={props.type ?? "button"} className={`ds-button ds-button-secondary ds-icon-button ${props.className ?? ""}`} aria-label={label} aria-pressed={active}><Icon name={icon} /></button>;
}
