// Input: JSON rows decoded from Natural Earth's 10m admin-1 DBF (5.1.1, public domain).
import fs from "node:fs";

const input = process.argv[2];
if (!input) throw new Error("Pass the Natural Earth admin-1 DBF rows JSON path");
const groups = {
  zh: "CN", zht: "TW HK MO", ja: "JP", ko: "KR KP", ru: "RU BY", uk: "UA",
  de: "DE AT LI", fr: "FR MC BE", es: "ES MX AR CL CO PE BO EC VE UY PY CU DO GT HN NI CR PA SV",
  pt: "PT BR AO MZ CV ST GW", it: "IT SM VA", nl: "NL SR", el: "GR CY",
  tr: "TR", pl: "PL", sv: "SE", hu: "HU", id: "ID", vi: "VN", bn: "BD",
  hi: "IN", fa: "IR AF", he: "IL", ur: "PK", ar: "SA EG IQ SY JO LB YE OM AE QA KW BH LY DZ MA TN SD MR PS",
};
const languages = Object.fromEntries(Object.entries(groups).flatMap(([lang, codes]) => codes.split(" ").map(code => [code, lang])));
const regions = JSON.parse(fs.readFileSync(input, "utf8")).flatMap(raw => {
  const p = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, typeof value === "string" ? value.replaceAll("\0", "").trim() : value]));
  // Tiny subdivisions wait for the basemap at closer zooms; city-states use the city label once.
  if (p.scalerank > 6 || (p.sameascity > 0 && p.iso_a2 !== "CN") || !Number.isFinite(p.longitude) || !Number.isFinite(p.latitude)) return [];
  let name = p[`name_${languages[p.iso_a2]}`] || p.name_local.split("|")[0] || p.name_en || p.name;
  if (p.iso_a2 === "CN") name = name.replace(/(?:维吾尔自治区|壮族自治区|回族自治区|自治区|省|市)$/, "");
  if (!name) return [];
  return [{ id: p.adm1_code, name, country: p.iso_a2, priority: p.scalerank,
    coordinates: [p.longitude, p.latitude] }];
});
fs.writeFileSync("backend/modules/map/data/regionIndex.json", JSON.stringify(regions));
console.log(`Wrote ${regions.length} region labels`);
