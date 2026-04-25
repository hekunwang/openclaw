export type ChatTurnTiming = {
  runId: string;
  sessionKey: string;
  submittedAt: number;
  ackAt: number | null;
  agentStartedAt: number | null;
  statusRunningAt: number | null;
  firstTextAt: number | null;
  finalAt: number | null;
};

type ChatTurnTimingState = {
  sessionKey?: string;
  chatTurnTimingCurrent?: ChatTurnTiming | null;
  chatTurnTimingLast?: ChatTurnTiming | null;
};

function cloneTiming(timing: ChatTurnTiming): ChatTurnTiming {
  return { ...timing };
}

function currentForRun(state: ChatTurnTimingState, runId: string): ChatTurnTiming | null {
  const current = state.chatTurnTimingCurrent;
  if (!current || current.runId !== runId) {
    return null;
  }
  return current;
}

export function beginChatTurnTiming(
  state: ChatTurnTimingState,
  params: { runId: string; sessionKey?: string; submittedAt?: number },
) {
  state.chatTurnTimingCurrent = {
    runId: params.runId,
    sessionKey: params.sessionKey?.trim() || state.sessionKey?.trim() || "main",
    submittedAt: params.submittedAt ?? Date.now(),
    ackAt: null,
    agentStartedAt: null,
    statusRunningAt: null,
    firstTextAt: null,
    finalAt: null,
  };
}

export function clearChatTurnTimingCurrent(state: ChatTurnTimingState, runId?: string) {
  if (!runId) {
    state.chatTurnTimingCurrent = null;
    return;
  }
  if (state.chatTurnTimingCurrent?.runId === runId) {
    state.chatTurnTimingCurrent = null;
  }
}

export function markChatTurnAck(state: ChatTurnTimingState, runId: string, at = Date.now()) {
  const current = currentForRun(state, runId);
  if (!current || current.ackAt != null) {
    return;
  }
  state.chatTurnTimingCurrent = {
    ...current,
    ackAt: at,
  };
}

export function markChatTurnAgentStart(state: ChatTurnTimingState, runId: string, at = Date.now()) {
  const current = currentForRun(state, runId);
  if (!current || current.agentStartedAt != null) {
    return;
  }
  state.chatTurnTimingCurrent = {
    ...current,
    agentStartedAt: at,
  };
}

export function markChatTurnStatusRunning(
  state: ChatTurnTimingState,
  runId: string,
  at = Date.now(),
) {
  const current = currentForRun(state, runId);
  if (!current || current.statusRunningAt != null) {
    return;
  }
  state.chatTurnTimingCurrent = {
    ...current,
    statusRunningAt: at,
  };
}

export function markChatTurnFirstText(state: ChatTurnTimingState, runId: string, at = Date.now()) {
  const current = currentForRun(state, runId);
  if (!current || current.firstTextAt != null) {
    return;
  }
  state.chatTurnTimingCurrent = {
    ...current,
    firstTextAt: at,
  };
}

export function markChatTurnTerminal(state: ChatTurnTimingState, runId: string, at = Date.now()) {
  const current = currentForRun(state, runId);
  if (!current) {
    return;
  }
  const finalized = {
    ...current,
    finalAt: current.finalAt ?? at,
  };
  state.chatTurnTimingCurrent = null;
  state.chatTurnTimingLast = cloneTiming(finalized);
}

export function getVisibleChatTurnTiming(
  current: ChatTurnTiming | null | undefined,
  last: ChatTurnTiming | null | undefined,
  sessionKey: string,
): ChatTurnTiming | null {
  if (current?.sessionKey === sessionKey) {
    return current;
  }
  if (last?.sessionKey === sessionKey) {
    return last;
  }
  return null;
}

export function formatLatencyMs(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }
  const seconds = value / 1000;
  return seconds >= 10 ? `${seconds.toFixed(1)}s` : `${seconds.toFixed(2)}s`;
}

export function summarizeChatTurnTiming(
  timing: ChatTurnTiming,
): Array<{ label: string; value: string }> {
  const ack = formatLatencyMs(timing.ackAt != null ? timing.ackAt - timing.submittedAt : null);
  const run = formatLatencyMs(
    timing.agentStartedAt != null ? timing.agentStartedAt - timing.submittedAt : null,
  );
  const yellow = formatLatencyMs(
    timing.statusRunningAt != null ? timing.statusRunningAt - timing.submittedAt : null,
  );
  const firstText = formatLatencyMs(
    timing.firstTextAt != null ? timing.firstTextAt - timing.submittedAt : null,
  );
  const done = formatLatencyMs(timing.finalAt != null ? timing.finalAt - timing.submittedAt : null);
  return [
    ack ? { label: "Ack", value: ack } : null,
    run ? { label: "Run", value: run } : null,
    yellow ? { label: "Yellow", value: yellow } : null,
    firstText ? { label: "First text", value: firstText } : null,
    done ? { label: "Done", value: done } : null,
  ].filter((entry): entry is { label: string; value: string } => entry !== null);
}
