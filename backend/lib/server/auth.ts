import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export const adminCookieName = "photo_archive_admin";
const maxAgeSeconds = 60 * 60 * 24 * 30;

// Local development opens Studio directly; deployments retain authentication.
export function isAdminAuthRequired() {
  return process.env.NODE_ENV !== "development" || process.env.ADMIN_AUTH_REQUIRED === "true";
}

type AuthPayload = {
  role: "admin";
  exp: number;
};

const getSecret = () => process.env.AUTH_COOKIE_SECRET || null;
const getAdminPassword = () => {
  const password = process.env.ADMIN_PASSWORD || process.env.SITE_PASSWORD;
  if (password) return password;
  return null;
};

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
function sign(value: string) {
  const secret = getSecret();
  if (!secret) throw new Error("请配置 AUTH_COOKIE_SECRET 后使用管理员登录。");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodePayload(payload: AuthPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): AuthPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AuthPayload>;
    if (parsed.role !== "admin" || typeof parsed.exp !== "number") return null;
    return { role: parsed.role, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();
  return Boolean(expected && getSecret() && safeEqual(password, expected));
}

export function setAdminCookie(response: NextResponse) {
  const payload = encodePayload({ role: "admin", exp: Date.now() + maxAgeSeconds * 1000 });
  response.cookies.set(adminCookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(adminCookieName, "", { path: "/", maxAge: 0 });
}

export function verifyAdminToken(token: string | undefined) {
  if (!token || !getSecret() || !getAdminPassword()) return false;
  const [payloadValue, signature, extra] = token.split(".");
  if (!payloadValue || !signature || extra) return false;
  if (!safeEqual(signature, sign(payloadValue))) return false;
  const payload = decodePayload(payloadValue);
  return Boolean(payload && payload.exp > Date.now());
}

export function hasAdminSession(request: NextRequest) {
  if (!isAdminAuthRequired()) return true;
  return verifyAdminToken(request.cookies.get(adminCookieName)?.value);
}

export async function hasAdminPageSession() {
  if (!isAdminAuthRequired()) return true;
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(adminCookieName)?.value);
}

export function requireAdminSession(request: NextRequest) {
  if (hasAdminSession(request)) return null;
  return NextResponse.json({ error: "需要管理员登录。" }, { status: 401 });
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const requestHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    if (origin === request.nextUrl.origin || (requestHost && new URL(origin).host === requestHost)) return null;
  } catch {
    // Fall through to the rejection below.
  }
  return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
}
