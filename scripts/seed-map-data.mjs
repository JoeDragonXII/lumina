/**
 * 地图页测试数据种子脚本
 * 用法: node scripts/seed-map-data.mjs
 *
 * 为全球各大洲创建地点和图集，方便测试大洲筛选功能。
 */

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "..", ".local-data", "library.sqlite");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const now = new Date().toISOString();

// ── 测试地点数据 ──
const seedLocations = [
  // 东亚
  { countryCode: "CN", countryName: "中国", city: "北京", displayName: "中国·北京", lat: 39.9042, lng: 116.4074 },
  { countryCode: "JP", countryName: "日本", city: "东京", displayName: "日本·东京", lat: 35.6762, lng: 139.6503 },
  { countryCode: "KR", countryName: "韩国", city: "首尔", displayName: "韩国·首尔", lat: 37.5665, lng: 126.978 },
  // 东南亚
  { countryCode: "TH", countryName: "泰国", city: "曼谷", displayName: "泰国·曼谷", lat: 13.7563, lng: 100.5018 },
  { countryCode: "VN", countryName: "越南", city: "河内", displayName: "越南·河内", lat: 21.0285, lng: 105.8542 },
  { countryCode: "SG", countryName: "新加坡", city: "新加坡", displayName: "新加坡", lat: 1.3521, lng: 103.8198 },
  // 南亚
  { countryCode: "IN", countryName: "印度", city: "新德里", displayName: "印度·新德里", lat: 28.6139, lng: 77.209 },
  { countryCode: "NP", countryName: "尼泊尔", city: "加德满都", displayName: "尼泊尔·加德满都", lat: 27.7172, lng: 85.324 },
  // 西亚
  { countryCode: "TR", countryName: "土耳其", city: "伊斯坦布尔", displayName: "土耳其·伊斯坦布尔", lat: 41.0082, lng: 28.9784 },
  { countryCode: "AE", countryName: "阿联酋", city: "迪拜", displayName: "阿联酋·迪拜", lat: 25.2048, lng: 55.2708 },
  // 中亚
  { countryCode: "KZ", countryName: "哈萨克斯坦", city: "阿拉木图", displayName: "哈萨克斯坦·阿拉木图", lat: 43.238, lng: 76.8826 },
  // 欧洲
  { countryCode: "FR", countryName: "法国", city: "巴黎", displayName: "法国·巴黎", lat: 48.8566, lng: 2.3522 },
  { countryCode: "IT", countryName: "意大利", city: "罗马", displayName: "意大利·罗马", lat: 41.9028, lng: 12.4964 },
  { countryCode: "GB", countryName: "英国", city: "伦敦", displayName: "英国·伦敦", lat: 51.5074, lng: -0.1278 },
  { countryCode: "DE", countryName: "德国", city: "柏林", displayName: "德国·柏林", lat: 52.52, lng: 13.405 },
  // 非洲
  { countryCode: "EG", countryName: "埃及", city: "开罗", displayName: "埃及·开罗", lat: 30.0444, lng: 31.2357 },
  { countryCode: "ZA", countryName: "南非", city: "开普敦", displayName: "南非·开普敦", lat: -33.9249, lng: 18.4241 },
  { countryCode: "MA", countryName: "摩洛哥", city: "马拉喀什", displayName: "摩洛哥·马拉喀什", lat: 31.6295, lng: -7.9811 },
  // 北美洲
  { countryCode: "US", countryName: "美国", city: "纽约", displayName: "美国·纽约", lat: 40.7128, lng: -74.006 },
  { countryCode: "CA", countryName: "加拿大", city: "温哥华", displayName: "加拿大·温哥华", lat: 49.2827, lng: -123.1207 },
  { countryCode: "MX", countryName: "墨西哥", city: "墨西哥城", displayName: "墨西哥·墨西哥城", lat: 19.4326, lng: -99.1332 },
  // 南美洲
  { countryCode: "BR", countryName: "巴西", city: "里约热内卢", displayName: "巴西·里约热内卢", lat: -22.9068, lng: -43.1729 },
  { countryCode: "AR", countryName: "阿根廷", city: "布宜诺斯艾利斯", displayName: "阿根廷·布宜诺斯艾利斯", lat: -34.6037, lng: -58.3816 },
  { countryCode: "PE", countryName: "秘鲁", city: "利马", displayName: "秘鲁·利马", lat: -12.0464, lng: -77.0428 },
  // 大洋洲
  { countryCode: "AU", countryName: "澳大利亚", city: "悉尼", displayName: "澳大利亚·悉尼", lat: -33.8688, lng: 151.2093 },
  { countryCode: "NZ", countryName: "新西兰", city: "奥克兰", displayName: "新西兰·奥克兰", lat: -36.8485, lng: 174.7633 },
];

// 获取已有的 photo_asset ID（用作封面）
const existingAssets = db.prepare("SELECT id FROM photo_assets LIMIT 1").all();
const fallbackAssetId = existingAssets.length > 0 ? existingAssets[0].id : null;

// ── 开始事务 ──
const transaction = db.transaction(() => {
  // 清理旧的测试数据（slug 以 seed- 开头的图集）
  const oldCollections = db.prepare("SELECT id FROM collections WHERE slug LIKE 'seed-%'").all();
  for (const c of oldCollections) {
    db.prepare("DELETE FROM collection_photos WHERE collection_id = ?").run(c.id);
    db.prepare("DELETE FROM collection_tags WHERE collection_id = ?").run(c.id);
  }
  db.prepare("DELETE FROM collections WHERE slug LIKE 'seed-%'").run();

  // 不删除已有 locations，保留之前数据库中的内容
  // 但如果 seed location 已经存在，则跳过插入

  const locationIds = {};

  for (const loc of seedLocations) {
    // 检查是否已有同国家+城市的地点
    const existing = db.prepare(
      "SELECT id FROM locations WHERE country_code = ? AND city = ?"
    ).get(loc.countryCode, loc.city);

    if (existing) {
      locationIds[loc.countryCode] = existing.id;
    } else {
      const id = randomUUID();
      db.prepare(`
        INSERT INTO locations (id, country_code, country_name, city, display_name, latitude, longitude, source, confirmed)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', 1)
      `).run(id, loc.countryCode, loc.countryName, loc.city, loc.displayName, loc.lat, loc.lng);
      locationIds[loc.countryCode] = id;
    }

    // 为每个地点创建一个图集
    const colId = randomUUID();
    const slug = `seed-${loc.countryCode.toLowerCase()}-${Date.now()}`;
    const title = `${loc.countryName}·${loc.city}`;

    db.prepare(`
      INSERT INTO collections (id, slug, title, story, category, visibility, featured, date_start, date_end, location_id, cover_asset_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, '摄影作品', 'public', 0, ?, ?, ?, ?, ?, ?)
    `).run(
      colId, slug, title,
      `在${loc.displayName}拍摄的作品集`,
      `${new Date().getFullYear()}-01-01`,
      `${new Date().getFullYear()}-12-31`,
      locationIds[loc.countryCode],
      fallbackAssetId,
      now, now,
    );

    // 如果有可用的封面图，建立关联
    if (fallbackAssetId) {
      db.prepare(`
        INSERT OR IGNORE INTO collection_photos (collection_id, asset_id, position, alt)
        VALUES (?, ?, 0, ?)
      `).run(colId, fallbackAssetId, title);
    }
  }

  // 为某些国家创建第二/第三个图集，让 count 更丰富
  const extraCollections = [
    { code: "CN", city: "上海", lat: 31.2304, lng: 121.4737, title: "中国·上海" },
    { code: "CN", city: "成都", lat: 30.5728, lng: 104.0668, title: "中国·成都" },
    { code: "JP", city: "京都", lat: 35.0116, lng: 135.7681, title: "日本·京都" },
    { code: "JP", city: "大阪", lat: 34.6937, lng: 135.5023, title: "日本·大阪" },
    { code: "TH", city: "清迈", lat: 18.7883, lng: 98.9853, title: "泰国·清迈" },
    { code: "VN", city: "胡志明市", lat: 10.8231, lng: 106.6297, title: "越南·胡志明市" },
    { code: "TR", city: "卡帕多奇亚", lat: 38.6431, lng: 34.8283, title: "土耳其·卡帕多奇亚" },
    { code: "FR", city: "尼斯", lat: 43.7102, lng: 7.262, title: "法国·尼斯" },
    { code: "IT", city: "佛罗伦萨", lat: 43.7696, lng: 11.2558, title: "意大利·佛罗伦萨" },
    { code: "US", city: "旧金山", lat: 37.7749, lng: -122.4194, title: "美国·旧金山" },
    { code: "BR", city: "圣保罗", lat: -23.5505, lng: -46.6333, title: "巴西·圣保罗" },
    { code: "AU", city: "墨尔本", lat: -37.8136, lng: 144.9631, title: "澳大利亚·墨尔本" },
  ];

  for (const ec of extraCollections) {
    const mainLocId = locationIds[ec.code];
    let locId = mainLocId;

    // 如果城市不同，需要单独创建 location
    const existingLoc = db.prepare(
      "SELECT id FROM locations WHERE country_code = ? AND city = ?"
    ).get(ec.code, ec.city);

    if (existingLoc) {
      locId = existingLoc.id;
    } else if (ec.city) {
      locId = randomUUID();
      const countryName = seedLocations.find((l) => l.countryCode === ec.code)?.countryName || ec.code;
      db.prepare(`
        INSERT INTO locations (id, country_code, country_name, city, display_name, latitude, longitude, source, confirmed)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', 1)
      `).run(locId, ec.code, countryName, ec.city, ec.title, ec.lat, ec.lng);
    }

    const colId = randomUUID();
    const slug = `seed-${ec.code.toLowerCase()}-${ec.city.toLowerCase()}-${Date.now()}`;

    db.prepare(`
      INSERT INTO collections (id, slug, title, story, category, visibility, featured, date_start, date_end, location_id, cover_asset_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, '摄影作品', 'public', 0, ?, ?, ?, ?, ?, ?)
    `).run(
      colId, slug, ec.title,
      `在${ec.title}拍摄的作品集`,
      `${new Date().getFullYear()}-01-01`,
      `${new Date().getFullYear()}-12-31`,
      locId, fallbackAssetId, now, now,
    );

    if (fallbackAssetId) {
      db.prepare(`
        INSERT OR IGNORE INTO collection_photos (collection_id, asset_id, position, alt)
        VALUES (?, ?, 0, ?)
      `).run(colId, fallbackAssetId, ec.title);
    }
  }
});

transaction();

// ── 验证 ──
const locationCount = db.prepare("SELECT COUNT(*) as c FROM locations").get();
const colCount = db.prepare("SELECT COUNT(*) as c FROM collections WHERE visibility = 'public' AND deleted_at IS NULL").get();
const summary = db.prepare(`
  SELECT l.country_code, COUNT(*) as cnt
  FROM collections c
  INNER JOIN locations l ON c.location_id = l.id
  WHERE c.visibility = 'public' AND c.deleted_at IS NULL
  GROUP BY l.country_code
  ORDER BY cnt DESC
`).all();

console.log("=== Seed 完成 ===");
console.log(`地点数量: ${locationCount.c}`);
console.log(`公开图集数量: ${colCount.c}`);
console.log("按国家统计:");
for (const row of summary) {
  console.log(`  ${row.country_code}: ${row.cnt} 个图集`);
}

db.close();
