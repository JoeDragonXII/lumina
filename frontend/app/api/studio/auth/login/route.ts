import { NextResponse, type NextRequest } from "next/server";
import { requireSameOrigin, setAdminCookie, verifyAdminPassword } from "@backend/lib/server/auth";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const payload = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof payload?.password === "string" ? payload.password : "";
  if (!verifyAdminPassword(password)) return NextResponse.json({ error: "密码不正确。" }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  setAdminCookie(response);
  return response;
}
