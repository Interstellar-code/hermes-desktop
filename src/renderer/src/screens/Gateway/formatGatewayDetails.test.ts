import { describe, expect, it } from "vitest";
import { formatGatewayDetails } from "./Gateway";

describe("formatGatewayDetails", () => {
  const now = 1_000_000_000_000;

  it("formats pid, uptime and port", () => {
    expect(
      formatGatewayDetails(
        { pid: 14886, startedAt: now - (2 * 60 + 4) * 60000, port: 8642 },
        now,
      ),
    ).toBe("pid 14886 · up 2h 04m · :8642");
  });

  it("shows minutes only under an hour", () => {
    expect(
      formatGatewayDetails(
        { pid: 1, startedAt: now - 7 * 60000, port: null },
        now,
      ),
    ).toBe("pid 1 · up 7m");
  });

  it("drops parts that are unknown or in the future", () => {
    expect(
      formatGatewayDetails({ pid: null, startedAt: now + 1, port: 8642 }, now),
    ).toBe(":8642");
  });
});
