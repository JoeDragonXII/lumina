import { describe, expect, it } from "vitest";
import { asianCountries, asianCountryByCode, asianCountryByNumericId } from "@backend/modules/map/data/asianCountries";

describe("asian country map metadata", () => {
  it("has unique country and map identifiers", () => {
    expect(new Set(asianCountries.map((item) => item.code)).size).toBe(asianCountries.length);
    expect(new Set(asianCountries.map((item) => item.numericId)).size).toBe(asianCountries.length);
  });

  it("covers China, Japan, Korea and Southeast Asia", () => {
    for (const code of ["CN", "JP", "KR", "TH", "VN", "SG", "MY", "ID"]) {
      expect(asianCountryByCode.has(code)).toBe(true);
    }
    expect(asianCountryByNumericId.get("156")?.code).toBe("CN");
  });
});
