/** Global continent definitions used for map filtering. */
export interface RegionDef {
  key: string;
  label: string;
  codes: readonly string[];
}

export const GLOBAL_REGIONS: RegionDef[] = [
  {
    key: "asia",
    label: "亚洲",
    codes: [
      // East Asia
      "CN", "JP", "KR", "KP", "MN", "TW", "HK", "MO",
      // Southeast Asia
      "TH", "VN", "KH", "LA", "MM", "MY", "SG", "ID", "PH", "BN", "TL",
      // South Asia
      "IN", "PK", "BD", "NP", "BT", "MV", "LK",
      // Central Asia
      "KZ", "KG", "TJ", "TM", "UZ",
      // West Asia / Middle East
      "AF", "AM", "AZ", "BH", "CY", "GE", "IR", "IQ", "IL", "JO",
      "KW", "LB", "OM", "QA", "SA", "SY", "TR", "AE", "YE", "PS",
    ],
  },
  {
    key: "europe",
    label: "欧洲",
    codes: [
      "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CZ", "DK",
      "EE", "FI", "FR", "DE", "GI", "GR", "HU", "IS", "IE", "IT",
      "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "NO",
      "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE",
      "CH", "UA", "GB", "VA", "MK", "FO", "AX", "GG", "JE", "IM",
      "XK", "SJ", "GI",
    ],
  },
  {
    key: "africa",
    label: "非洲",
    codes: [
      "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD",
      "KM", "CG", "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET",
      "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG",
      "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW",
      "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG",
      "TN", "UG", "ZM", "ZW", "EH",
    ],
  },
  {
    key: "north-america",
    label: "北美洲",
    codes: [
      "US", "CA", "MX", "GL",
      // Central America
      "GT", "BZ", "SV", "HN", "NI", "CR", "PA",
      // Caribbean
      "CU", "DO", "HT", "JM", "PR", "BS", "BB", "DM", "GD", "KN",
      "LC", "VC", "TT", "AG", "AI", "AW", "BM", "BQ", "KY", "CW",
      "GP", "MQ", "MS", "SX", "TC", "VG", "VI", "BL", "MF", "PM",
    ],
  },
  {
    key: "south-america",
    label: "南美洲",
    codes: [
      "AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GY", "PY",
      "PE", "SR", "UY", "VE",
    ],
  },
  {
    key: "oceania",
    label: "大洋洲",
    codes: [
      "AU", "NZ", "PG", "FJ", "SB", "VU", "NC", "PF", "WS", "TO",
      "TV", "KI", "NR", "PW", "FM", "MH", "CK", "NU", "AS", "GU",
      "MP", "WF", "PN", "TK",
    ],
  },
];

/** Map from country code → region key, for O(1) lookup. */
export const countryToRegion: Record<string, string> = {};
for (const r of GLOBAL_REGIONS) {
  for (const code of r.codes) {
    countryToRegion[code] = r.key;
  }
}
