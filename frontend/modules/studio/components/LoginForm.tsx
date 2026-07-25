"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

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
      <label className="text-sm font-medium text-neutral-800" htmlFor="admin-password">
        管理密码
      </label>
      <div className="mt-2 flex items-center gap-3 border border-neutral-300 bg-white px-3 py-3">
        <LockKeyhole className="h-4 w-4 text-neutral-500" />
        <input
          autoFocus
          className="min-w-0 flex-1 bg-transparent outline-none"
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <button className="mt-5 w-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={loading}>
        {loading ? "正在登录..." : "进入 Studio"}
      </button>
    </form>
  );
}
