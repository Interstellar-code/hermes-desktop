import { render, screen, type RenderResult } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { sharedI18n } from "../../../../shared/i18n";
import { I18nContext } from "../../components/I18nContext";
import { MemoryProviders } from "./MemoryProviders";
import type { MemoryProviderInfo } from "./types";

const PROVIDERS: MemoryProviderInfo[] = [
  {
    name: "matrix-memory",
    description: "providerDescMatrix",
    installed: true,
    active: true,
    envVars: ["MATRIX_API_KEY"],
  },
  {
    name: "byterover",
    description: "providerDescByterover",
    installed: false,
    active: false,
    envVars: ["BRV_API_KEY"],
  },
  {
    name: "hindsight",
    description: "providerDescHindsight",
    installed: false,
    active: false,
    envVars: [],
  },
];

function renderProviders(
  activeProvider: string | null = "matrix-memory",
): RenderResult {
  const i18n = sharedI18n.cloneInstance({ lng: "en", initImmediate: false });
  return render(
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={{ locale: "en", setLocale: vi.fn() }}>
        <MemoryProviders
          providers={PROVIDERS}
          activeProvider={activeProvider}
          onRefresh={vi.fn()}
        />
      </I18nContext.Provider>
    </I18nextProvider>,
  );
}

describe("MemoryProviders card layout", () => {
  it("shows the active provider as its own highlighted row with a deactivate action", () => {
    const { container } = renderProviders();

    const activeRow = container.querySelector(".mx-provider-active-card");
    expect(activeRow?.textContent).toContain("matrix-memory");
    expect(activeRow?.querySelector(".mx-chip--ok")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeTruthy();
  });

  it("offers one activate action per inactive provider", () => {
    renderProviders();

    const activateButtons = screen.getAllByRole("button", { name: "Activate" });
    expect(activateButtons).toHaveLength(2);
  });

  it("labels every required env key input", () => {
    renderProviders();

    expect(screen.getByLabelText(/MATRIX_API_KEY/)).toBeTruthy();
    expect(screen.getByLabelText(/BRV_API_KEY/)).toBeTruthy();
  });
});
