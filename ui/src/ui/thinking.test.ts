import { describe, expect, it } from "vitest";
import {
  formatThinkingLevels,
  listThinkingLevelLabels,
  supportsXHighThinking,
} from "./thinking.ts";

describe("ui thinking level helpers", () => {
  it("exposes xhigh for local custom OpenAI GPT-5.4/GPT-5.5 models", () => {
    expect(supportsXHighThinking("custom-openai", "gpt-5.4")).toBe(true);
    expect(supportsXHighThinking("custom-openai-responses", "gpt-5.4-pro")).toBe(true);
    expect(supportsXHighThinking("custom-openai", "gpt-5.5")).toBe(true);
    expect(supportsXHighThinking("custom-openai-responses", "gpt-5.5-pro")).toBe(true);
    expect(listThinkingLevelLabels("custom-openai", "gpt-5.5")).toEqual([
      "off",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
    ]);
    expect(formatThinkingLevels("custom-openai", "gpt-5.5")).toBe(
      "off, minimal, low, medium, high, xhigh",
    );
  });

  it("exposes xhigh for local openai-codex GPT-5.4/GPT-5.5 models", () => {
    expect(supportsXHighThinking("openai-codex", "gpt-5.4")).toBe(true);
    expect(supportsXHighThinking("openai-codex", "gpt-5.5-pro")).toBe(true);
    expect(listThinkingLevelLabels("openai-codex", "gpt-5.4")).toEqual([
      "off",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
    ]);
  });

  it("keeps bundled openai xhigh limited to the known GPT-5 fallback set", () => {
    expect(supportsXHighThinking("openai", "gpt-5.2")).toBe(true);
    expect(supportsXHighThinking("openai", "gpt-5.4-nano")).toBe(true);
    expect(supportsXHighThinking("openai", "gpt-4o")).toBe(false);
  });

  it("does not expose adaptive from browser fallback labels", () => {
    expect(listThinkingLevelLabels("custom-openai", "gpt-5.4")).not.toContain("adaptive");
    expect(listThinkingLevelLabels("openai-codex", "gpt-5.5")).not.toContain("adaptive");
    expect(listThinkingLevelLabels("custom-openai", "gpt-4o")).toEqual([
      "off",
      "minimal",
      "low",
      "medium",
      "high",
    ]);
  });
});
