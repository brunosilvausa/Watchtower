import { notFound } from "next/navigation";
import { Showcase } from "./showcase";

export const metadata = { title: "Watchtower — Design system", robots: { index: false, follow: false } };
export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Showcase />;
}
