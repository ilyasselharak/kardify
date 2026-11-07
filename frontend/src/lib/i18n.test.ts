import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

const flatten = (o: object, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? flatten(v, `${p}${k}.`) : [`${p}${k}`]));

describe("translations", () => {
  it("English and Arabic have exactly the same keys", () => {
    expect(flatten(ar).sort()).toEqual(flatten(en).sort());
  });
  it("has no empty Arabic strings", () => {
    const leaves = (o: object, p = ""): [string, unknown][] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? leaves(v, `${p}${k}.`) : [[`${p}${k}`, v] as [string, unknown]]));
    expect(leaves(ar).filter(([, v]) => typeof v !== "string" || v.trim() === "").map(([k]) => k)).toEqual([]);
  });
});
