import { StatusView } from "./status-view";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <StatusView slug={slug} />; }
