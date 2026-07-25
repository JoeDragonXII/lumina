import { NextResponse, type NextRequest } from "next/server";
import { clearAdminCookie, requireSameOrigin } from "@backend/lib/server/auth";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);
  return response;
}
