import { describe, expect, it } from "vitest";

import { chooseGridOwner } from "@/modules/map/gridOwnership";

describe("chooseGridOwner", () => {
  it("assigns a border cell to the country with the majority", () => {
    expect(
      chooseGridOwner([
        ...Array<string>(24).fill("US"),
        ...Array<string>(25).fill("CA"),
      ]),
    ).toBe("CA");
  });

  it("keeps a cell when land covers the majority", () => {
    expect(
      chooseGridOwner([
        ...Array<string>(25).fill("JP"),
        ...Array<null>(24).fill(null),
      ]),
    ).toBe("JP");
  });

  it("leaves a cell empty when water covers the majority", () => {
    expect(
      chooseGridOwner([
        ...Array<string>(24).fill("JP"),
        ...Array<null>(25).fill(null),
      ]),
    ).toBeNull();
  });
});
