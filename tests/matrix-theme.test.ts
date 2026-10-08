import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { DEFAULT_DARK_THEME, THEMES } from "../src/renderer/src/constants";

const CSS = readFileSync(
  join(import.meta.dirname, "../src/renderer/src/assets/main.css"),
  "utf8",
);

// @lat: [[matrix-theme]]
describe("Matrix theme", () => {
  it("is the default dark theme and registered as dark", () => {
    expect(DEFAULT_DARK_THEME).toBe("matrix");
    expect(THEMES.find((t) => t.id === "matrix")?.appearance).toBe("dark");
  });

  it("has a token block for every registered theme", () => {
    for (const { id } of THEMES) {
      expect(CSS).toContain(`[data-theme="${id}"] {`);
    }
  });
});
