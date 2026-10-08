import { describe, expect, it } from "vitest";
import { humanSchedule } from "./Schedules";

// humanSchedule must never invent text for cron forms it cannot render
// exactly: steps, ranges, lists and wildcards in min/hour/dow return "".
// Only plain-integer minute/hour with dow "*" or a single 0-6 integer
// (and dom/month "*") produce text.
describe("humanSchedule", () => {
  it("returns empty for a day-of-week range", () => {
    expect(humanSchedule("0 9 * * 1-5")).toBe("");
  });

  it("returns empty for a step minutes expression", () => {
    expect(humanSchedule("*/15 * * * *")).toBe("");
  });

  it("returns empty for a step hours expression", () => {
    expect(humanSchedule("0 */2 * * *")).toBe("");
  });

  it("returns empty for a wildcard hour", () => {
    expect(humanSchedule("0 * * * *")).toBe("");
  });

  it("humanizes a plain daily cron", () => {
    expect(humanSchedule("0 15 * * *")).toBe("daily 15:00");
  });

  it("humanizes a plain weekly cron with the plain day name", () => {
    expect(humanSchedule("30 7 * * 1")).toBe("Monday 07:30");
  });
});
