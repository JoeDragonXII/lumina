import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { adminCookieName, isAdminAuthRequired, setAdminCookie, verifyAdminPassword, verifyAdminToken } from "./auth";

afterEach(() => vi.unstubAllEnvs());

function configure() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ADMIN_PASSWORD", "test-password");
  vi.stubEnv("SITE_PASSWORD", "");
  vi.stubEnv("AUTH_COOKIE_SECRET", "test-signing-key");
}

describe("administrator authentication", () => {
  it("rejects predictable fallback credentials when configuration is missing", () => {
    configure();
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("AUTH_COOKIE_SECRET", "");
    expect(verifyAdminPassword("LOCAL_ONLY_NO_PASSWORD")).toBe(false);
    const payload = Buffer.from(JSON.stringify({ role: "admin", exp: Date.now() + 60000 })).toString("base64url");
    const signature = createHmac("sha256", "lumina-local-secret").update(payload).digest("base64url");
    expect(verifyAdminToken(`${payload}.${signature}`)).toBe(false);
  });

  it("requires both a configured password and signing secret", () => {
    configure();
    vi.stubEnv("AUTH_COOKIE_SECRET", "");
    expect(verifyAdminPassword("test-password")).toBe(false);
    expect(() => setAdminCookie(new NextResponse())).toThrow("AUTH_COOKIE_SECRET");
  });

  it("accepts signed sessions and rejects tampering and expiration", () => {
    configure();
    expect(verifyAdminPassword("test-password")).toBe(true);
    expect(verifyAdminPassword("wrong")).toBe(false);
    const response = new NextResponse();
    setAdminCookie(response);
    const token = response.cookies.get(adminCookieName)!.value;
    expect(verifyAdminToken(token)).toBe(true);
    expect(verifyAdminToken(`${token}x`)).toBe(false);
    const expired = Buffer.from(JSON.stringify({ role: "admin", exp: Date.now() - 1 })).toString("base64url");
    const signature = createHmac("sha256", "test-signing-key").update(expired).digest("base64url");
    expect(verifyAdminToken(`${expired}.${signature}`)).toBe(false);
  });

  it("keeps direct Studio access limited to local development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_AUTH_REQUIRED", "false");
    expect(isAdminAuthRequired()).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    expect(isAdminAuthRequired()).toBe(true);
  });
});
