import { describe, expect, it } from "vitest";
import { selectHomeCards } from "./HomeCards";

const session = {
  id: "s1",
  title: null,
  preview: "SSH into mac mini",
  messageCount: 6,
  startedAt: 100,
  endedAt: 200,
};

const job = (
  name: string,
  next: string | null,
  enabled = true,
): {
  name: string;
  schedule: string;
  enabled: boolean;
  state: string;
  next_run_at: string | null;
} => ({
  name,
  schedule: "0 15 * * *",
  enabled,
  state: "active",
  next_run_at: next,
});

describe("selectHomeCards", () => {
  it("returns nothing when every source failed", () => {
    expect(selectHomeCards(null, null, null)).toEqual({
      continueSession: null,
      nextRun: null,
      todoCount: null,
    });
  });

  it("uses the latest session and falls back to its preview for the title", () => {
    const cards = selectHomeCards([session], [], null);
    expect(cards.continueSession).toEqual({
      id: "s1",
      title: "SSH into mac mini",
      messageCount: 6,
      at: 200,
    });
  });

  it("picks the earliest enabled job with a next run", () => {
    const cards = selectHomeCards(
      null,
      [
        job("later", "2026-10-09T15:00:00Z"),
        job("disabled", "2026-10-09T01:00:00Z", false),
        job("never", null),
        job("bad-date", "not a date"),
        job("soon", "2026-10-09T07:30:00Z"),
      ],
      null,
    );
    expect(cards.nextRun?.name).toBe("soon");
  });

  it("counts to-do tasks only from a successful kanban reply", () => {
    expect(
      selectHomeCards(null, null, { success: true, data: [{}, {}] }).todoCount,
    ).toBe(2);
    expect(selectHomeCards(null, null, { success: false }).todoCount).toBe(
      null,
    );
  });
});
