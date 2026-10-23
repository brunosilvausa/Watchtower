"use client";
import { createContext, useContext } from "react";
export type DatePreferences = { timezone: string; dateFormat: string };
export const PreferencesChangedContext = createContext<(preferences: DatePreferences & { language: string }) => void>(() => {});
export const DatePreferenceContext = createContext<DatePreferences>({ timezone: "UTC", dateFormat: "DD/MM/YYYY" });
export function useProductDate() {
  const preferences = useContext(DatePreferenceContext);
  return (value: unknown) => formatProductDate(value, preferences);
}
export function formatProductDate(value: unknown, preferences: DatePreferences): string {
    if (typeof value !== "string" && typeof value !== "number") return "—";
    const date = new Date(value); if (!Number.isFinite(date.getTime())) return "—";
    const parts = new Intl.DateTimeFormat("en", { timeZone: preferences.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
    const part = (type: string) => parts.find(item => item.type === type)?.value ?? "";
    const formatted = preferences.dateFormat === "YYYY-MM-DD" ? `${part("year")}-${part("month")}-${part("day")}` : preferences.dateFormat === "MM/DD/YYYY" ? `${part("month")}/${part("day")}/${part("year")}` : `${part("day")}/${part("month")}/${part("year")}`;
    return `${formatted} ${part("hour")}:${part("minute")} (${preferences.timezone})`;
}
