import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession, requireSameOrigin } from "@backend/lib/server/auth";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { parseCollectionInput } from "@backend/modules/studio/server/input";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  return NextResponse.json(libraryRepository.listCollections({ visibility: "all" }));
}

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  try {
    const collection = libraryRepository.createCollection(parseCollectionInput(await request.json()));
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "图集创建失败。" }, { status: 400 });
  }
}
