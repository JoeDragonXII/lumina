import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export const adminCookieName = "photo_archive_admin";
const maxAgeSeconds = 60 * 60 * 24 * 30;

type AuthPayload = {
  role: "admin";
  exp: number;
};

const getSecret = () => process.env.AUTH_COOKIE_SECRET || "lumina-local-secret";
const getAdminPassword = () => {
  const password = process.env.ADMIN_PASSWORD || process.env.SITE_PASSWORD;
  if (password) return password;
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] ⚠️ 未设置 ADMIN_PASSWORD 环境变量，管理后台无密码保护。");
  }
  return "LOCAL_ONLY_NO_PASSWORD";
};

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
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
  return safeEqual(password, getAdminPassword());
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
  if (!token) return false;
  const [payloadValue, signature, extra] = token.split(".");
  if (!payloadValue || !signature || extra) return false;
  if (!safeEqual(signature, sign(payloadValue))) return false;
  const payload = decodePayload(payloadValue);
  return Boolean(payload && payload.exp > Date.now());
}

export function hasAdminSession(request: NextRequest) {
  return verifyAdminToken(request.cookies.get(adminCookieName)?.value);
}

export async function hasAdminPageSession() {
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
