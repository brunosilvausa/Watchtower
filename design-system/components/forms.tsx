"use client";
import { useId, useRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label: string; hint?: string; error?: string; valid?: boolean }
export function Input({ label, hint, error, valid, id, className = "", ...props }: InputProps) {
  const generated = useId(); const inputId = id ?? generated;
  const description = [props["aria-describedby"], error || hint ? `${inputId}-hint` : undefined].filter(Boolean).join(" ");
  return <div className="ds-field"><label htmlFor={inputId}>{label}</label><input {...props} id={inputId} className={`ds-input ${className}`} aria-invalid={Boolean(error) || props["aria-invalid"]} aria-describedby={description || undefined} data-valid={valid || undefined} />
    {(error || hint) && <p id={`${inputId}-hint`} className={error ? "ds-error" : "wt-caption"} role={error ? "alert" : undefined}>{error || hint}</p>}
  </div>;
}
export function Select({ label, options, id, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string; disabled?: boolean }[] }) {
  const generated = useId(); const selectId = id ?? generated;
  return <div className="ds-field"><label htmlFor={selectId}>{label}</label><select {...props} id={selectId} className="ds-input" disabled={props.disabled || !options.length}>
    {options.length ? options.map(option => <option key={option.value} {...option}>{option.label}</option>) : <option value="">No options</option>}
  </select></div>;
}
export function Checkbox({ label, id, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  const generated = useId();
  return <label className="ds-check" htmlFor={id ?? generated}><input {...props} id={id ?? generated} type="checkbox" />{label}</label>;
}
export function Switch({ label, id, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & { label: string }) {
  const generated = useId();
  return <label className="ds-check ds-switch" htmlFor={id ?? generated}><input {...props} id={id ?? generated} type="checkbox" role="switch" /><span className="ds-switch-track" aria-hidden="true" />{label}</label>;
}
export interface TabItem { value: string; label: ReactNode; content: ReactNode; disabled?: boolean }
export function Tabs({ items, value, onChange, label, orientation = "horizontal" }: { items: TabItem[]; value: string; onChange: (value: string) => void; label: string; orientation?: "horizontal" | "vertical" }) {
  const id = useId(); const ref = useRef<HTMLDivElement>(null);
  const enabled = items.filter(item => !item.disabled);
  const selected = enabled.some(item => item.value === value) ? value : enabled[0]?.value;
  return <div className="ds-tabs"><div ref={ref} role="tablist" aria-label={label} aria-orientation={orientation} className="ds-tab-list" onKeyDown={event => {
    const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    if (![nextKey, previousKey, "Home", "End"].includes(event.key) || !enabled.length) return;
    event.preventDefault();
    const current = enabled.findIndex(item => item.value === selected);
    const index = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (event.key === nextKey ? 1 : -1) + enabled.length) % enabled.length;
    onChange(enabled[index].value);
    const target = items.findIndex(item => item.value === enabled[index].value);
    ref.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[target]?.focus();
  }}>
    {items.map((item, i) => <button key={item.value} id={`${id}-tab-${i}`} type="button" role="tab" disabled={item.disabled} aria-selected={selected === item.value} aria-controls={`${id}-panel-${i}`} tabIndex={selected === item.value ? 0 : -1} onClick={() => onChange(item.value)}>{item.label}</button>)}
  </div>{items.map((item, i) => <div key={item.value} id={`${id}-panel-${i}`} role="tabpanel" aria-labelledby={`${id}-tab-${i}`} hidden={selected !== item.value} tabIndex={0} className="ds-tab-panel">{item.content}</div>)}</div>;
}
