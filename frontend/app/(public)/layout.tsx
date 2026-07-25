import PublicExperienceShell from "@/modules/public/components/PublicExperienceShell";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PublicExperienceShell>{children}</PublicExperienceShell>;
}
