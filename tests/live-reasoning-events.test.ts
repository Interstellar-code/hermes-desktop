import { describe, expect, it } from "vitest";
import { upsertLiveReasoningChunk } from "../src/renderer/src/screens/Chat/liveReasoningEvents";
import { reasoningSeconds } from "../src/renderer/src/screens/Chat/HistoryRow";
import type { ReasoningMessage } from "../src/renderer/src/screens/Chat/types";
import type { ChatMessage } from "../src/renderer/src/screens/Chat/types";

describe("upsertLiveReasoningChunk", () => {
  it("inserts reasoning before an active assistant content bubble", () => {
    const messages: ChatMessage[] = [
      { id: "u-1", role: "user", content: "answer" },
      { id: "a-1", role: "agent", content: "Final text" },
    ];

    const next = upsertLiveReasoningChunk(messages, "thinking", 100);

    expect(next.map((m) => m.id)).toEqual(["u-1", "reasoning-100-2", "a-1"]);
    expect(next[1]).toMatchObject({
      kind: "reasoning",
      text: "thinking",
    });
  });

  it("appends to the reasoning block at the live insertion point", () => {
    const messages: ChatMessage[] = [
      { id: "u-1", role: "user", content: "answer" },
      {
        id: "r-1",
        kind: "reasoning",
        role: "agent",
        text: "first ",
      },
      { id: "a-1", role: "agent", content: "Final text" },
    ];

    const next = upsertLiveReasoningChunk(messages, "second", 100);

    expect(next.map((m) => m.id)).toEqual(["u-1", "r-1", "a-1"]);
    expect(next[1]).toMatchObject({
      kind: "reasoning",
      text: "first second",
    });
  });

  it("starts a new reasoning block after intervening tool rows", () => {
    const messages: ChatMessage[] = [
      { id: "u-1", role: "user", content: "make image" },
      {
        id: "r-1",
        kind: "reasoning",
        role: "agent",
        text: "plan",
      },
      {
        id: "tool-call-skill",
        kind: "tool_call",
        role: "agent",
        callId: "call-skill",
        name: "skill_view",
        args: "ai-playground",
        status: "completed",
      },
    ];

    const next = upsertLiveReasoningChunk(messages, "after tool", 101);

    expect(next.map((m) => m.id)).toEqual([
      "u-1",
      "r-1",
      "tool-call-skill",
      "reasoning-101-3",
    ]);
    expect(next[1]).toMatchObject({ kind: "reasoning", text: "plan" });
    expect(next[3]).toMatchObject({
      kind: "reasoning",
      text: "after tool",
    });
  });

  it("starts a new reasoning block after tools but before active content", () => {
    const messages: ChatMessage[] = [
      { id: "u-1", role: "user", content: "make image" },
      {
        id: "r-1",
        kind: "reasoning",
        role: "agent",
        text: "plan",
      },
      {
        id: "tool-call-skill",
        kind: "tool_call",
        role: "agent",
        callId: "call-skill",
        name: "skill_view",
        args: "ai-playground",
        status: "completed",
      },
      { id: "a-1", role: "agent", content: "Done" },
    ];

    const next = upsertLiveReasoningChunk(messages, "after tool", 102);

    expect(next.map((m) => m.id)).toEqual([
      "u-1",
      "r-1",
      "tool-call-skill",
      "reasoning-102-4",
      "a-1",
    ]);
    expect(next[1]).toMatchObject({ kind: "reasoning", text: "plan" });
    expect(next[3]).toMatchObject({
      kind: "reasoning",
      text: "after tool",
    });
  });

  it("can force a new reasoning segment after a tool boundary", () => {
    const messages: ChatMessage[] = [
      { id: "u-1", role: "user", content: "make image" },
      {
        id: "r-1",
        kind: "reasoning",
        role: "agent",
        text: "before tool",
      },
      { id: "a-1", role: "agent", content: "Done" },
    ];

    const next = upsertLiveReasoningChunk(messages, "after tool", 103, true);

    expect(next.map((m) => m.id)).toEqual([
      "u-1",
      "r-1",
      "reasoning-103-3",
      "a-1",
    ]);
    expect(next[1]).toMatchObject({
      kind: "reasoning",
      text: "before tool",
    });
    expect(next[2]).toMatchObject({
      kind: "reasoning",
      text: "after tool",
    });
  });
});

describe("live reasoning timing", () => {
  it("records first and latest chunk time on a live row", () => {
    const first = upsertLiveReasoningChunk([], "a", 1000);
    const next = upsertLiveReasoningChunk(first, "b", 5200);
    expect(next[0]).toMatchObject({ startedAt: 1000, updatedAt: 5200 });
    expect(reasoningSeconds(next[0] as ReasoningMessage)).toBe(4);
  });

  it("shows no duration for history rows or sub-second thoughts", () => {
    const history: ReasoningMessage = {
      id: "r",
      kind: "reasoning",
      role: "agent",
      text: "x",
    };
    expect(reasoningSeconds(history)).toBeNull();
    expect(
      reasoningSeconds({ ...history, startedAt: 0, updatedAt: 400 }),
    ).toBeNull();
  });
});
