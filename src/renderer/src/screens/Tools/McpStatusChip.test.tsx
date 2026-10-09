import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { McpStatusChip } from "./McpStatusChip";

describe("McpStatusChip", () => {
  it("renders 'off' when disabled", () => {
    const { container } = render(
      <McpStatusChip enabled={false} toolCount={5} />,
    );
    expect(container.textContent).toBe("off");
  });

  it("renders 'not tested' when enabled with no count", () => {
    const { container } = render(
      <McpStatusChip enabled={true} toolCount={undefined} />,
    );
    expect(container.textContent).toBe("not tested");
  });

  it("renders '● 12 tools' when enabled with 12 tools", () => {
    const { container } = render(
      <McpStatusChip enabled={true} toolCount={12} />,
    );
    expect(container.textContent).toContain("12");
    expect(container.textContent).toContain("tools");
  });
});
