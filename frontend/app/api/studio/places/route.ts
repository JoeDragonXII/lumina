import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminSession } from '@backend/lib/server/auth';
import { searchPlaces } from '@backend/modules/map/server/searchPlaces';
export async function GET(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  const query = request.nextUrl.searchParams.get('q')?.trim() || '';
  const city = request.nextUrl.searchParams.get('city')?.trim() || '';
  if (!query || query.length > 160) return NextResponse.json({ error: '请输入 1–160 个字符的地点名称。' }, { status: 400 });
  if (city.length > 64) return NextResponse.json({ error: '城市名称不能超过 64 个字符。' }, { status: 400 });
  try { return NextResponse.json({ results: await searchPlaces(query, city) }); }
  catch { return NextResponse.json({ error: '地点搜索暂不可用，请重试或在地图上选点。' }, { status: 502 }); }
}
