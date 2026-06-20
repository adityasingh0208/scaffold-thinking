import {
  buildClarificationPrompt,
  clarificationResponseFormat,
  ClarificationQuestion,
} from "../prompts/clarification";
import { ModelProvider } from "../providers/types";
import { ProblemInput } from "../types";

export async function clarify(
  input: ProblemInput,
  provider: ModelProvider
): Promise<ClarificationQuestion[]> {
  const prompt = buildClarificationPrompt(input);
  const schema = clarificationResponseFormat.json_schema.schema;
  const result = await provider.completeStructured<{
    questions: ClarificationQuestion[];
  }>(prompt, schema);
  return result.questions;
}
