import { NextResponse, type NextRequest } from "next/server";
import { requireAdminSession, requireSameOrigin } from "@backend/lib/server/auth";
import { processPhotoUpload } from "@backend/modules/media/server/processor";
import { inferLocationFromCoordinates } from "@backend/modules/map/server/inferLocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxFileBytes = 200 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "请选择照片。" }, { status: 400 });

  const assets = [];
  const errors: Array<{ name: string; error: string }> = [];
  for (const file of files) {
    if (file.size > maxFileBytes) {
      errors.push({ name: file.name, error: "单张照片不能超过 200MB。" });
      continue;
    }
    try {
      assets.push(
        await processPhotoUpload({ name: file.name, type: file.type, buffer: Buffer.from(await file.arrayBuffer()) }),
      );
    } catch (error) {
      errors.push({ name: file.name, error: error instanceof Error ? error.message : "处理失败。" });
    }
  }

  const gpsAsset = assets.find(
    (item) => item.asset.latitude !== null && item.asset.longitude !== null,
  );
  const locationSuggestion = gpsAsset
    ? inferLocationFromCoordinates(gpsAsset.asset.latitude!, gpsAsset.asset.longitude!)
    : null;

  return NextResponse.json({ assets, errors, locationSuggestion }, { status: assets.length > 0 ? 200 : 422 });
}
