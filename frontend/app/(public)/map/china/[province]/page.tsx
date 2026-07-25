import { redirect } from "next/navigation";

export default async function ChinaProvinceRedirect({
  params,
}: {
  params: Promise<{ province: string }>;
}) {
  const { province } = await params;
  redirect(`/map/asia/cn/${province}`);
}
