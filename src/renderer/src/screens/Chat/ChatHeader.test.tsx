import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatHeader } from "./ChatHeader";

describe("ChatHeader", () => {
  it("shows the conversation model", () => {
    render(<ChatHeader model="grok-4.6" contextUsage={null} />);

    expect(screen.getByText("grok-4.6")).toBeInTheDocument();
  });

  it("omits the token chip until context usage is reported", () => {
    render(<ChatHeader model="grok-4.6" contextUsage={null} />);

    expect(screen.queryByText(/tok$/)).toBeNull();
  });

  it("reports the reported context token count", () => {
    render(
      <ChatHeader
        model="grok-4.6"
        contextUsage={{ used: 48_000, window: 230_000 }}
      />,
    );

    expect(screen.getByText("48k tok")).toBeInTheDocument();
  });
});
