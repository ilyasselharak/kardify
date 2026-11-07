import { describe, expect, it } from "vitest";
import { safeNext } from "./navigation";

describe("safeNext (open-redirect protection)", () => {
  it("allows same-site relative paths", () => {
    expect(safeNext("/en/dashboard/cards", "en")).toBe("/en/dashboard/cards");
  });
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNext("https://evil.com", "ar")).toBe("/ar/dashboard");
    expect(safeNext("//evil.com/x", "en")).toBe("/en/dashboard");
    expect(safeNext(null, "en")).toBe("/en/dashboard");
    expect(safeNext("/\\evil.com", "en")).toBe("/en/dashboard");
  });
});
