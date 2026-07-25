import { redirect } from "next/navigation";
import { hasAdminPageSession } from "@backend/lib/server/auth";
import StudioNav from "@/modules/studio/components/StudioNav";

export const dynamic = "force-dynamic";

export default async function ProtectedStudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await hasAdminPageSession())) redirect("/studio/login");
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900 lg:grid lg:grid-cols-[240px_1fr]">
      <StudioNav />
      <main className="min-w-0 px-4 py-7 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
