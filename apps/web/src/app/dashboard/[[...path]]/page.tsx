import { headers } from "next/headers";
import { requireActor } from "@/lib/access";
import { ProductShell } from "../product-shell";
export default async function Page() {
  let platformAllowed = false;
  try { const actor = await requireActor(await headers()); platformAllowed = actor.platformAdmin && actor.mfaVerified; } catch { /* The client session flow presents authentication errors. */ }
  return <ProductShell platformAllowed={platformAllowed} />;
}
