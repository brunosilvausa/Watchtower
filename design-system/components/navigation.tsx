"use client";
import { useState, type ReactNode } from "react";
import { Icon } from "./core";
import type { IconName } from "./icons";
import { Dialog } from "./feedback";
import { Input } from "./forms";
import { Button, IconButton } from "./actions";

export function Wordmark() { return <span className="ds-wordmark">Watchtower<span aria-hidden="true">.</span></span>; }
export interface NavItem { label: string; href: string; icon?: IconName; group?: string; badge?: number }
export function TopNav({ items = [], children }: { items?: NavItem[]; children?: ReactNode }) {
  return <header className="ds-topnav"><Wordmark /><nav aria-label="Main navigation">{items.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>{children}</header>;
}
export function Sidebar({ items, active, label = "Section navigation", collapsed = false, variant = "default" }: { items: NavItem[]; active?: string; label?: string; collapsed?: boolean; variant?: "default" | "product" }) {
  return <nav className={`ds-sidebar ${variant === "product" ? "ds-sidebar-product" : "wt-mat-smoked"}`} data-collapsed={collapsed || undefined} aria-label={label}>{items.map((item, index) => <div key={item.href}>
    {item.group && item.group !== items[index - 1]?.group && <p className={`ds-nav-group ${collapsed ? "wt-sr-only" : ""}`}>{item.group}</p>}
    <a href={item.href} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined} aria-current={active === item.href ? "page" : undefined}>{item.icon && <Icon name={item.icon} />}<span className={collapsed ? "wt-sr-only" : "ds-nav-label"}>{item.label}</span>{Boolean(item.badge) && !collapsed && <span className="ds-nav-count" aria-hidden="true">{item.badge}</span>}</a>
  </div>)}</nav>;
}
export function AppTopBar({ title, onSearch }: { title: string; onSearch: () => void }) {
  return <header className="ds-appbar"><span className="wt-card-title">{title}</span><Button variant="secondary" icon="search" onClick={onSearch}>Search</Button></header>;
}
export function Footer({ children }: { children?: ReactNode }) { return <footer className="ds-footer"><Wordmark />{children}</footer>; }
export interface CommandItem { id: string; label: string; hint?: string; onSelect: () => void }
export function CommandPalette({ open, onClose, items }: { open: boolean; onClose: () => void; items: CommandItem[] }) {
  const [query, setQuery] = useState("");
  const matches = items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
  return <Dialog open={open} onClose={onClose} title="Command palette" description="Search the available local actions.">
    <Input label="Search commands" value={query} onChange={event => setQuery(event.target.value)} />
    <ul className="ds-commands">{matches.map(item => <li key={item.id}><button type="button" onClick={() => { item.onSelect(); onClose(); }}>{item.label}<span>{item.hint}</span></button></li>)}</ul>
    {!matches.length && <p role="status">No commands found.</p>}
  </Dialog>;
}
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><IconButton icon="menu" label="Open navigation" onClick={() => setOpen(true)} /><Dialog open={open} onClose={() => setOpen(false)} title="Navigation">{children}</Dialog></>;
}
