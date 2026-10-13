"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui/controls";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/studio/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "登录失败。");
      return;
    }
    router.replace("/studio");
    router.refresh();
  }

  return (
    <form className="mt-8" onSubmit={submit}>
      <label className="text-sm font-medium text-[var(--ui-muted)]" htmlFor="admin-password">
        管理密码
      </label>
      <div className="studio-password">
        <LockKeyhole className="h-4 w-4 text-neutral-500" />
        <Input
          autoFocus
          autoComplete="current-password"
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-[var(--ui-danger)]">{error}</p> : null}
      <Button type="submit" variant="primary" className="mt-5 w-full" disabled={loading}>
        {loading ? "正在登录..." : "进入 Studio"}
      </Button>
    </form>
  );
}
