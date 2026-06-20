export { clarify } from "./stages/clarify";
export { diverge } from "./stages/diverge";
export { decide } from "./stages/decide";

export { AnthropicProvider, DEFAULT_MODEL as ANTHROPIC_DEFAULT_MODEL } from "./providers/anthropic";
export { OpenAIProvider, DEFAULT_MODEL as OPENAI_DEFAULT_MODEL } from "./providers/openai";
export type { ModelProvider, JSONSchema } from "./providers/types";

export type { ProblemInput, Clarification } from "./types";
export type { ClarificationQuestion } from "./prompts/clarification";
export type {
  SolutionOption,
  ComplexitySignals,
  SolutionSet,
  SolutionGenerationOptions,
} from "./prompts/solution-generation";
export type { DecisionContext } from "./prompts/decision-capture";

export {
  buildClarificationPrompt,
  clarificationResponseFormat,
} from "./prompts/clarification";
export {
  buildSolutionGenerationPrompt,
  solutionGenerationResponseFormat,
  normalizeRecommendations,
} from "./prompts/solution-generation";
export { buildDecisionCapturePrompt } from "./prompts/decision-capture";
