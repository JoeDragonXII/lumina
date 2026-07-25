/** Asian sub-region definitions used for map filtering. */
export interface RegionDef {
  key: string;
  label: string;
  codes: readonly string[];
}

export const ASIAN_REGIONS: RegionDef[] = [
  {
    key: "east-asia",
    label: "东亚",
    codes: ["CN", "JP", "KR", "KP", "MN", "TW"],
  },
  {
    key: "southeast-asia",
    label: "东南亚",
    codes: ["TH", "VN", "KH", "LA", "MM", "MY", "SG", "ID", "PH", "BN", "TL"],
  },
  {
    key: "south-asia",
    label: "南亚",
    codes: ["IN", "PK", "BD", "NP", "BT", "MV", "LK"],
  },
  {
    key: "central-asia",
    label: "中亚",
    codes: ["KZ", "KG", "TJ", "TM", "UZ"],
  },
  {
    key: "west-asia",
    label: "西亚",
    codes: [
      "AF", "AM", "AZ", "BH", "CY", "GE", "IR", "IQ", "IL", "JO",
      "KW", "LB", "OM", "QA", "SA", "SY", "TR", "AE", "YE", "PS",
    ],
  },
];

/** Map from country code → region key, for O(1) lookup. */
export const countryToRegion: Record<string, string> = {};
for (const r of ASIAN_REGIONS) {
  for (const code of r.codes) {
    countryToRegion[code] = r.key;
  }
}
