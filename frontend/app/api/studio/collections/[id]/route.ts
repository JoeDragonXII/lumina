import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession, requireSameOrigin } from "@backend/lib/server/auth";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { parseCollectionInput } from "@backend/modules/studio/server/input";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const collection = libraryRepository.getCollectionById((await context.params).id, true);
  return collection ? NextResponse.json(collection) : NextResponse.json({ error: "图集不存在。" }, { status: 404 });
}

export async function PUT(request: NextRequest, context: Context) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  try {
    const collection = libraryRepository.updateCollection(
      (await context.params).id,
      parseCollectionInput(await request.json()),
    );
    return NextResponse.json({ collection });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "图集保存失败。" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  libraryRepository.softDeleteCollection((await context.params).id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, context: Context) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const payload = (await request.json().catch(() => null)) as { action?: unknown } | null;
  if (payload?.action !== "restore") return NextResponse.json({ error: "未知操作。" }, { status: 400 });
  libraryRepository.restoreCollection((await context.params).id);
  return NextResponse.json({ ok: true });
}
