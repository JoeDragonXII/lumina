import { redirect } from "next/navigation";
import { hasAdminPageSession, isAdminAuthRequired } from "@backend/lib/server/auth";
import StudioShell from "@/modules/studio/components/StudioShell";

export const dynamic = "force-dynamic";

export default async function ProtectedStudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await hasAdminPageSession())) redirect("/studio/login");
  return (
    <StudioShell showLogout={isAdminAuthRequired()}>{children}</StudioShell>
  );
}
