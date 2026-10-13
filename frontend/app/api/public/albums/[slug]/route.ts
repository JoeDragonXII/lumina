import { NextResponse } from 'next/server';
import { getPublicMapAlbum } from '@backend/modules/library/server/publicRead';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: {params: Promise<{slug:string}>}) {
  const album = getPublicMapAlbum((await context.params).slug);
  return NextResponse.json(album ? {album} : {error:'图集不存在或尚未公开。'}, {status:album ? 200 : 404, headers:{'Cache-Control':'no-store'}});
}
