import { normalizeLowercaseStringOrEmpty } from "./string-coerce.ts";

export type ThinkingCatalogEntry = {
  provider: string;
  id: string;
  reasoning?: boolean;
};

const BASE_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high"] as const;
const OPENAI_XHIGH_MODEL_RE = /^gpt-5\.(?:2|[45])(?:-|$)/i;
const LOCAL_OPENAI_XHIGH_MODEL_RE = /^gpt-5\.[45](?:-|$)/i;

export function normalizeThinkingProviderId(provider?: string | null): string {
  if (!provider) {
    return "";
  }
  const normalized = normalizeLowercaseStringOrEmpty(provider);
  if (normalized === "z.ai" || normalized === "z-ai") {
    return "zai";
  }
  if (normalized === "bedrock" || normalized === "aws-bedrock") {
    return "amazon-bedrock";
  }
  return normalized;
}

export function isBinaryThinkingProvider(provider?: string | null): boolean {
  void provider;
  return false;
}

export function normalizeThinkLevel(raw?: string | null): string | undefined {
  if (!raw) {
    return undefined;
  }
  const key = normalizeLowercaseStringOrEmpty(raw);
  const collapsed = key.replace(/[\s_-]+/g, "");
  if (collapsed === "adaptive" || collapsed === "auto") {
    return "adaptive";
  }
  if (collapsed === "max") {
    return "max";
  }
  if (collapsed === "xhigh" || collapsed === "extrahigh") {
    return "xhigh";
  }
  if (key === "off" || key === "none") {
    return "off";
  }
  if (["on", "enable", "enabled"].includes(key)) {
    return "low";
  }
  if (["min", "minimal"].includes(key)) {
    return "minimal";
  }
  if (["low", "thinkhard", "think-hard", "think_hard"].includes(key)) {
    return "low";
  }
  if (["mid", "med", "medium", "thinkharder", "think-harder", "harder"].includes(key)) {
    return "medium";
  }
  if (["high", "ultra", "ultrathink", "think-hard", "thinkhardest", "highest"].includes(key)) {
    return "high";
  }
  if (key === "think") {
    return "minimal";
  }
  return undefined;
}

export function supportsXHighThinking(provider?: string | null, model?: string | null): boolean {
  const normalizedProvider = normalizeThinkingProviderId(provider);
  const normalizedModel = normalizeLowercaseStringOrEmpty(model ?? "");
  if (!normalizedProvider || !normalizedModel) {
    return false;
  }
  if (normalizedProvider === "openai") {
    return OPENAI_XHIGH_MODEL_RE.test(normalizedModel);
  }
  return (
    (normalizedProvider === "openai-codex" ||
      normalizedProvider === "custom-openai" ||
      normalizedProvider === "custom-openai-responses") &&
    LOCAL_OPENAI_XHIGH_MODEL_RE.test(normalizedModel)
  );
}

export function listThinkingLevelLabels(
  provider?: string | null,
  model?: string | null,
): readonly string[] {
  if (supportsXHighThinking(provider, model)) {
    return ["off", "minimal", "low", "medium", "high", "xhigh"];
  }
  return BASE_THINKING_LEVELS;
}

export function formatThinkingLevels(provider?: string | null, model?: string | null): string {
  return listThinkingLevelLabels(provider, model).join(", ");
}

export function resolveThinkingDefaultForModel(params: {
  provider: string;
  model: string;
  catalog?: ThinkingCatalogEntry[];
}): string {
  const candidate = params.catalog?.find(
    (entry) => entry.provider === params.provider && entry.id === params.model,
  );
  return candidate?.reasoning ? "low" : "off";
}
