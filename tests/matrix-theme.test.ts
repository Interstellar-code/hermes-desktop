import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { DEFAULT_DARK_THEME, THEMES } from "../src/renderer/src/constants";

const CSS = readFileSync(
  join(import.meta.dirname, "../src/renderer/src/assets/main.css"),
  "utf-8",
);

/** Custom properties declared in a theme's own `[data-theme="<id>"] { … }` block. */
function themeVars(id: string): string[] {
  const block = CSS.match(
    new RegExp(`^\\[data-theme="${id}"\\] \\{([^}]*)\\}`, "m"),
  );
  if (!block) return [];
  return [...block[1].matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]);
}

// @lat: [[matrix-theme]]
describe("Matrix theme", () => {
  it("is the default dark theme and registered as dark", () => {
    expect(DEFAULT_DARK_THEME).toBe("matrix");
    expect(THEMES.find((t) => t.id === "matrix")?.appearance).toBe("dark");
  });

  it("defines every token the dark theme defines", () => {
    const dark = themeVars("dark");
    expect(dark.length).toBeGreaterThan(20);
    expect(themeVars("matrix")).toEqual(expect.arrayContaining(dark));
  });

  it("has a token block for every registered theme", () => {
    for (const { id } of THEMES) {
      expect(themeVars(id).length).toBeGreaterThan(0);
    }
  });
});
