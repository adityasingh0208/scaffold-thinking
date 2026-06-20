import {
  buildDecisionCapturePrompt,
  DecisionContext,
} from "../prompts/decision-capture";
import { ModelProvider } from "../providers/types";

export async function decide(
  context: DecisionContext,
  provider: ModelProvider
): Promise<string> {
  const prompt = buildDecisionCapturePrompt(context);
  return provider.complete(prompt);
}
