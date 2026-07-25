import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminPageSession } from "@backend/lib/server/auth";
import { siteConfig } from "@/modules/core/site";
import LoginForm from "@/modules/studio/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function StudioLoginPage() {
  if (await hasAdminPageSession()) redirect("/studio");
  return (
    <main className="grid min-h-dvh place-items-center bg-neutral-100 px-4 py-12 text-neutral-900">
      <section className="w-full max-w-sm border border-neutral-200 bg-white p-7 shadow-sm">
        <Link className="text-xs font-semibold uppercase text-neutral-500" href="/">返回 {siteConfig.name}</Link>
        <h1 className="mt-8 text-3xl font-semibold">内容管理</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">登录后可以导入照片、整理图集并控制公开范围。</p>
        <LoginForm />
      </section>
    </main>
  );
}
