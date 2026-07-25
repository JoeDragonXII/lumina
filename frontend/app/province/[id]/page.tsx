import { redirect } from "next/navigation";

export default async function LegacyProvincePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  redirect(`/map/china/${(await params).id}`);
}
