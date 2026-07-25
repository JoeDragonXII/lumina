import { NextResponse, type NextRequest } from "next/server";
import { hasAdminSession } from "@backend/lib/server/auth";
import type { MediaVariantName } from "@backend/modules/core/types";
import { libraryRepository } from "@backend/modules/library/server/repository";
import { readStoredFile } from "@backend/modules/media/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedVariants = new Set<MediaVariantName>(["thumb", "display", "large"]);

export async function GET(request: NextRequest, context: { params: Promise<{ assetId: string; variant: string }> }) {
  const { assetId, variant } = await context.params;
  if (!allowedVariants.has(variant as MediaVariantName)) return new NextResponse(null, { status: 404 });

  const isPublic = libraryRepository.isAssetPublic(assetId);
  if (!isPublic && !hasAdminSession(request)) return new NextResponse(null, { status: 404 });

  const storedVariant = libraryRepository.getVariant(assetId, variant as MediaVariantName);
  if (!storedVariant) return new NextResponse(null, { status: 404 });

  try {
    const content = await readStoredFile(storedVariant.relativePath);
    return new NextResponse(new Uint8Array(content), {
      headers: {
        "Content-Type": storedVariant.mimeType,
        "Content-Length": String(content.length),
        "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
