export interface AsianCountry {
  code: string;
  numericId: string;
  name: string;
  mapName: string;
}

export const asianCountries: AsianCountry[] = [
  { code: "AF", numericId: "004", name: "阿富汗", mapName: "Afghanistan" },
  { code: "AM", numericId: "051", name: "亚美尼亚", mapName: "Armenia" },
  { code: "AZ", numericId: "031", name: "阿塞拜疆", mapName: "Azerbaijan" },
  { code: "BH", numericId: "048", name: "巴林", mapName: "Bahrain" },
  { code: "BD", numericId: "050", name: "孟加拉国", mapName: "Bangladesh" },
  { code: "BT", numericId: "064", name: "不丹", mapName: "Bhutan" },
  { code: "BN", numericId: "096", name: "文莱", mapName: "Brunei" },
  { code: "KH", numericId: "116", name: "柬埔寨", mapName: "Cambodia" },
  { code: "CN", numericId: "156", name: "中国", mapName: "China" },
  { code: "CY", numericId: "196", name: "塞浦路斯", mapName: "Cyprus" },
  { code: "GE", numericId: "268", name: "格鲁吉亚", mapName: "Georgia" },
  { code: "IN", numericId: "356", name: "印度", mapName: "India" },
  { code: "ID", numericId: "360", name: "印度尼西亚", mapName: "Indonesia" },
  { code: "IR", numericId: "364", name: "伊朗", mapName: "Iran" },
  { code: "IQ", numericId: "368", name: "伊拉克", mapName: "Iraq" },
  { code: "IL", numericId: "376", name: "以色列", mapName: "Israel" },
  { code: "JP", numericId: "392", name: "日本", mapName: "Japan" },
  { code: "JO", numericId: "400", name: "约旦", mapName: "Jordan" },
  { code: "KZ", numericId: "398", name: "哈萨克斯坦", mapName: "Kazakhstan" },
  { code: "KW", numericId: "414", name: "科威特", mapName: "Kuwait" },
  { code: "KG", numericId: "417", name: "吉尔吉斯斯坦", mapName: "Kyrgyzstan" },
  { code: "LA", numericId: "418", name: "老挝", mapName: "Laos" },
  { code: "LB", numericId: "422", name: "黎巴嫩", mapName: "Lebanon" },
  { code: "MY", numericId: "458", name: "马来西亚", mapName: "Malaysia" },
  { code: "MV", numericId: "462", name: "马尔代夫", mapName: "Maldives" },
  { code: "MN", numericId: "496", name: "蒙古", mapName: "Mongolia" },
  { code: "MM", numericId: "104", name: "缅甸", mapName: "Myanmar" },
  { code: "NP", numericId: "524", name: "尼泊尔", mapName: "Nepal" },
  { code: "KP", numericId: "408", name: "朝鲜", mapName: "North Korea" },
  { code: "KR", numericId: "410", name: "韩国", mapName: "South Korea" },
  { code: "OM", numericId: "512", name: "阿曼", mapName: "Oman" },
  { code: "PK", numericId: "586", name: "巴基斯坦", mapName: "Pakistan" },
  { code: "PS", numericId: "275", name: "巴勒斯坦", mapName: "Palestine" },
  { code: "PH", numericId: "608", name: "菲律宾", mapName: "Philippines" },
  { code: "QA", numericId: "634", name: "卡塔尔", mapName: "Qatar" },
  { code: "SA", numericId: "682", name: "沙特阿拉伯", mapName: "Saudi Arabia" },
  { code: "SG", numericId: "702", name: "新加坡", mapName: "Singapore" },
  { code: "LK", numericId: "144", name: "斯里兰卡", mapName: "Sri Lanka" },
  { code: "SY", numericId: "760", name: "叙利亚", mapName: "Syria" },
  { code: "TW", numericId: "158", name: "中国台湾", mapName: "Taiwan" },
  { code: "TJ", numericId: "762", name: "塔吉克斯坦", mapName: "Tajikistan" },
  { code: "TH", numericId: "764", name: "泰国", mapName: "Thailand" },
  { code: "TL", numericId: "626", name: "东帝汶", mapName: "Timor-Leste" },
  { code: "TR", numericId: "792", name: "土耳其", mapName: "Turkey" },
  { code: "TM", numericId: "795", name: "土库曼斯坦", mapName: "Turkmenistan" },
  { code: "AE", numericId: "784", name: "阿联酋", mapName: "United Arab Emirates" },
  { code: "UZ", numericId: "860", name: "乌兹别克斯坦", mapName: "Uzbekistan" },
  { code: "VN", numericId: "704", name: "越南", mapName: "Vietnam" },
  { code: "YE", numericId: "887", name: "也门", mapName: "Yemen" },
];

export const asianCountryByCode = new Map(asianCountries.map((country) => [country.code, country]));
export const asianCountryByNumericId = new Map(asianCountries.map((country) => [country.numericId, country]));
