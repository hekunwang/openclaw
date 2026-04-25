import { describe, expect, it } from "vitest";
import {
  beginChatTurnTiming,
  getVisibleChatTurnTiming,
  markChatTurnAck,
  markChatTurnAgentStart,
  markChatTurnFirstText,
  markChatTurnStatusRunning,
  markChatTurnTerminal,
  summarizeChatTurnTiming,
  type ChatTurnTiming,
} from "./chat-turn-timing.ts";

describe("chat-turn-timing", () => {
  it("tracks submit, run, yellow, first-text, and final timings", () => {
    const state: {
      sessionKey: string;
      chatTurnTimingCurrent: ChatTurnTiming | null;
      chatTurnTimingLast: ChatTurnTiming | null;
    } = {
      sessionKey: "main",
      chatTurnTimingCurrent: null,
      chatTurnTimingLast: null,
    };

    beginChatTurnTiming(state, { runId: "run-1", submittedAt: 1_000 });
    markChatTurnAck(state, "run-1", 1_080);
    markChatTurnAgentStart(state, "run-1", 2_500);
    markChatTurnStatusRunning(state, "run-1", 3_100);
    markChatTurnFirstText(state, "run-1", 3_900);
    markChatTurnTerminal(state, "run-1", 5_000);

    expect(state.chatTurnTimingCurrent).toBeNull();
    expect(state.chatTurnTimingLast).toMatchObject({
      runId: "run-1",
      submittedAt: 1_000,
      ackAt: 1_080,
      agentStartedAt: 2_500,
      statusRunningAt: 3_100,
      firstTextAt: 3_900,
      finalAt: 5_000,
    });
    expect(summarizeChatTurnTiming(state.chatTurnTimingLast!)).toEqual([
      { label: "Ack", value: "80ms" },
      { label: "Run", value: "1.50s" },
      { label: "Yellow", value: "2.10s" },
      { label: "First text", value: "2.90s" },
      { label: "Done", value: "4.00s" },
    ]);
  });

  it("prefers current timing for the active session", () => {
    const current: ChatTurnTiming = {
      runId: "run-1",
      sessionKey: "main",
      submittedAt: 0,
      ackAt: null,
      agentStartedAt: null,
      statusRunningAt: null,
      firstTextAt: null,
      finalAt: null,
    };
    const last: ChatTurnTiming = {
      runId: "run-0",
      sessionKey: "main",
      submittedAt: 0,
      ackAt: 10,
      agentStartedAt: 20,
      statusRunningAt: 30,
      firstTextAt: 40,
      finalAt: 50,
    };

    expect(getVisibleChatTurnTiming(current, last, "main")).toBe(current);
    expect(getVisibleChatTurnTiming(null, last, "main")).toBe(last);
    expect(getVisibleChatTurnTiming(current, last, "other")).toBeNull();
  });
});
