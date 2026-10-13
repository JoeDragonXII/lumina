// Source: Natural Earth 5.1.2, ne_10m_populated_places.geojson (public domain).
// Pass a downloaded Natural Earth GeoJSON; never access the photo library.
import fs from "node:fs";

const input = process.argv[2];
if (!input) throw new Error("Pass the Natural Earth populated places GeoJSON path");
const groups = {
  ZH: "CN", ZHT: "TW HK MO", JA: "JP", KO: "KR KP", RU: "RU BY", UK: "UA",
  DE: "DE AT LI", FR: "FR MC BE", ES: "ES MX AR CL CO PE BO EC VE UY PY CU DO GT HN NI CR PA SV GQ",
  PT: "PT BR AO MZ CV ST GW", IT: "IT SM VA", NL: "NL SR", EL: "GR CY",
  TR: "TR", PL: "PL", SV: "SE", HU: "HU", ID: "ID", VI: "VN", BN: "BD",
  HI: "IN", FA: "IR AF", HE: "IL", UR: "PK", AR: "SA EG IQ SY JO LB YE OM AE QA KW BH LY DZ MA TN SD MR PS",
};
const languages = Object.fromEntries(Object.entries(groups).flatMap(([lang, codes]) => codes.split(" ").map(code => [code, lang])));
const chineseRegional = new Set("海口 合肥 石家庄 呼和浩特 西宁 拉萨 银川 兰州 南宁 贵阳 重庆 福州 广州 西安 太原 武汉 长沙 昆明 郑州 沈阳 济南 天津 南昌 南京 杭州 长春 哈尔滨 乌鲁木齐 成都 上海 北京".split(" "));
const source = JSON.parse(fs.readFileSync(input, "utf8"));
const cities = source.features.flatMap(({ properties: p }) => {
  const zh = p.NAME_ZH || "";
  const capital = p.ADM0CAP === 1;
  const mega = p.POP_MAX >= 5000000 || p.WORLDCITY === 1;
  const regional = p.ISO_A2 === "CN" ? chineseRegional.has(zh)
    : /Admin-1/.test(p.FEATURECLA) && p.POP_MAX >= 250000;
  if (!capital && !mega && !regional && p.POP_MAX < 1000000) return [];
  const tier = capital ? 1 : mega ? 2 : 3;
  let name = p[`NAME_${languages[p.ISO_A2]}`] || p.NAME_EN || p.NAME;
  if (p.NAME_EN === "Tokyo") name = "東京";
  if (p.NAME_EN === "Kyiv" || p.NAME_EN === "Kiev") name = "Київ";
  const aliases = [...new Set([p.NAME, p.NAMEASCII, p.NAME_EN, name, zh].filter(Boolean))];
  return [{ id: String(p.NE_ID), name, zh, country: p.ISO_A2, tier,
    priority: tier * 100 + Math.max(0, 99 - Math.log10(Math.max(1, p.POP_MAX)) * 10),
    coordinates: [p.LONGITUDE, p.LATITUDE], aliases }];
}).sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
fs.writeFileSync("backend/modules/map/data/cityIndex.json", JSON.stringify(cities));
const chineseNames = source.features.filter(({ properties: p }) => p.ISO_A2 === "CN" && p.NAME_ZH)
  .map(({ properties: p }) => ({ name: p.NAME_ZH,
    aliases: [...new Set([p.NAME, p.NAMEASCII, p.NAME_EN, p.NAME_ZH].filter(Boolean))] }));
fs.writeFileSync("backend/modules/map/data/chineseCityNames.json", JSON.stringify(chineseNames));
console.log(`Wrote ${cities.length} cities, ${fs.statSync("backend/modules/map/data/cityIndex.json").size} bytes`);
