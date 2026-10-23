"use client";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  window.addEventListener("wt:motion", callback);
  return () => { media.removeEventListener("change", callback); window.removeEventListener("wt:motion", callback); };
}
function snapshot() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce"; }
export function useReducedMotion() { return useSyncExternalStore(subscribe, snapshot, () => false); }
export function setMotionPreference(preference: "system" | "reduce") {
  if (preference === "reduce") document.documentElement.dataset.motion = "reduce";
  else delete document.documentElement.dataset.motion;
  window.dispatchEvent(new Event("wt:motion"));
}
function Spatial({ children, mode }: { children: ReactNode; mode: "tilt" | "magnetic" }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reset = () => { node.style.removeProperty("--dx"); node.style.removeProperty("--dy"); node.style.removeProperty("--light-x"); node.style.removeProperty("--light-y"); };
    if (reduced) { reset(); return; }
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let rect: DOMRect | undefined;
    const leave = () => { cancelAnimationFrame(frame); rect = undefined; reset(); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !pointer.matches) return;
      rect ??= node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty("--dx", String(x)); node.style.setProperty("--dy", String(y));
        node.style.setProperty("--light-x", `${(x + 1) * 50}%`); node.style.setProperty("--light-y", `${(y + 1) * 50}%`);
      });
    };
    node.addEventListener("pointermove", move); node.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", leave, true); pointer.addEventListener("change", leave);
    return () => { leave(); node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave); window.removeEventListener("scroll", leave, true); pointer.removeEventListener("change", leave); };
  }, [reduced]);
  return <div ref={ref} className={`ds-${mode}`} data-reduced={reduced || undefined}>{children}</div>;
}
export function Tilt({ children }: { children: ReactNode }) { return <Spatial mode="tilt">{children}</Spatial>; }
export function Magnetic({ children }: { children: ReactNode }) { return <Spatial mode="magnetic">{children}</Spatial>; }
