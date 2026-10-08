import {
  render,
  screen,
  fireEvent,
  type RenderResult,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sharedI18n } from "../../../../shared/i18n";
import { I18nContext } from "../../components/I18nContext";
import { MemoryProviders } from "./MemoryProviders";
import type { MemoryProviderInfo } from "./types";

// byterover is active and has a PROVIDER_URLS entry; matrix-memory has no URL;
// hindsight has a URL but no env keys.
const PROVIDERS: MemoryProviderInfo[] = [
  {
    name: "byterover",
    description: "providerDescByterover",
    installed: true,
    active: true,
    envVars: ["BRV_API_KEY"],
  },
  {
    name: "matrix-memory",
    description: "providerDescMatrix",
    installed: false,
    active: false,
    envVars: ["MATRIX_API_KEY"],
  },
  {
    name: "hindsight",
    description: "providerDescHindsight",
    installed: false,
    active: false,
    envVars: [],
  },
];

const openExternal = vi.fn().mockResolvedValue(true);

beforeEach(() => {
  openExternal.mockClear();
  Object.defineProperty(window, "hermesAPI", {
    configurable: true,
    value: { openExternal },
  });
});

function renderProviders(
  activeProvider: string | null = "byterover",
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
    expect(activeRow?.textContent).toContain("byterover");
    expect(activeRow?.querySelector(".mx-chip--ok")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeTruthy();
  });

  it("offers one activate action per inactive provider", () => {
    renderProviders();

    const activateButtons = screen.getAllByRole("button", { name: "Activate" });
    expect(activateButtons).toHaveLength(2);
  });

  // Regression: the active card lost its website button when the layout was
  // split into an active row plus an inactive grid. Fails on round-1 code.
  it("keeps the website button on the active provider card", () => {
    const { container } = renderProviders();

    const activeRow = container.querySelector(".mx-provider-active-card");
    const docsButton = activeRow?.querySelector(".mx-provider-docs");
    expect(docsButton).toBeTruthy();
    expect(docsButton?.getAttribute("aria-label")).toBe(
      "Open provider website",
    );

    fireEvent.click(docsButton as Element);
    expect(openExternal).toHaveBeenCalledWith("https://app.byterover.dev");
  });

  it("only renders the website button on cards whose provider has a known URL", () => {
    const { container } = renderProviders();

    const docsButtons = container.querySelectorAll(".mx-provider-docs");
    // byterover (active) + hindsight (inactive, has a URL); matrix-memory has none.
    expect(docsButtons).toHaveLength(2);
  });

  it("labels every required env key input", () => {
    renderProviders();

    expect(screen.getByLabelText(/BRV_API_KEY/)).toBeTruthy();
    expect(screen.getByLabelText(/MATRIX_API_KEY/)).toBeTruthy();
  });

  it("gives two mounted instances distinct input ids", () => {
    const i18n = sharedI18n.cloneInstance({ lng: "en", initImmediate: false });
    const tree = (): React.JSX.Element => (
      <I18nextProvider i18n={i18n}>
        <I18nContext.Provider value={{ locale: "en", setLocale: vi.fn() }}>
          <MemoryProviders
            providers={PROVIDERS}
            activeProvider="byterover"
            onRefresh={vi.fn()}
          />
        </I18nContext.Provider>
      </I18nextProvider>
    );
    const { container } = render(
      <>
        {tree()}
        {tree()}
      </>,
    );

    const ids = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        ".memory-provider-field input",
      ),
    ).map((input) => input.id);
    expect(ids.length).toBeGreaterThan(1);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
