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

  it("renders '● 1 tool' when enabled with a single tool", () => {
    const { container } = render(
      <McpStatusChip enabled={true} toolCount={1} />,
    );
    expect(container.textContent).toBe("● 1 tool");
  });

  it("renders '● 12 tools' when enabled with 12 tools", () => {
    const { container } = render(
      <McpStatusChip enabled={true} toolCount={12} />,
    );
    expect(container.textContent).toBe("● 12 tools");
  });
});
