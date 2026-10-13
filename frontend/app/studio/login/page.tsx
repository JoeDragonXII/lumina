import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminPageSession } from "@backend/lib/server/auth";
import { siteConfig } from "@/modules/core/site";
import LoginForm from "@/modules/studio/components/LoginForm";
import { BeamCard } from "@/components/ui/beam-card";
import { Sparkles } from "lucide-react";
import styles from "@/modules/studio/components/studio-paper.module.css";

export const dynamic = "force-dynamic";

export default async function StudioLoginPage() {
  if (await hasAdminPageSession()) redirect("/studio");
  return (
    <main className="studio-theme studio-login">
      <BeamCard className="studio-login-card">
        <Link className={styles.brand} href="/" aria-label={`返回 ${siteConfig.name}`}><Sparkles size={17} strokeWidth={1.4} />LUMINA</Link>
        <h1 className="mt-8 text-3xl font-medium">Studio</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ui-muted)]">导入照片，整理图集。</p>
        <LoginForm />
      </BeamCard>
    </main>
  );
}
