import { redirect } from "next/navigation";

export default async function PreviewMapPage({
  searchParams,
}: {
  searchParams: Promise<{
    continent?: string | string[];
    display?: string | string[];
    theme?: string | string[];
    view?: string | string[];
  }>;
}) {
  await searchParams;
  redirect("/map");
}
