import {
  buildSolutionGenerationPrompt,
  solutionGenerationResponseFormat,
  normalizeRecommendations,
  SolutionOption,
  SolutionGenerationOptions,
} from "../prompts/solution-generation";
import { ModelProvider } from "../providers/types";
import { ProblemInput, Clarification } from "../types";

export async function diverge(
  input: ProblemInput,
  clarifications: Clarification[],
  provider: ModelProvider,
  options: SolutionGenerationOptions = {}
): Promise<SolutionOption[]> {
  const prompt = buildSolutionGenerationPrompt(input, clarifications, options);
  const schema = solutionGenerationResponseFormat.json_schema.schema;
  const result = await provider.completeStructured<{
    solutions: SolutionOption[];
  }>(prompt, schema);
  return normalizeRecommendations(result.solutions);
}
