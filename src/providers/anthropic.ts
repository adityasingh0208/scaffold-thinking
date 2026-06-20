import Anthropic from "@anthropic-ai/sdk";
import { ModelProvider, JSONSchema } from "./types";

export const DEFAULT_MODEL = "claude-opus-4-8";

export class AnthropicProvider implements ModelProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    if (block.type !== "text") throw new Error("Unexpected non-text response");
    return block.text;
  }

  async completeStructured<T>(prompt: string, schema: JSONSchema): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      tools: [
        {
          name: "structured_output",
          description: "Return structured data matching the provided schema",
          input_schema: schema as Anthropic.Tool["input_schema"],
        },
      ],
      tool_choice: { type: "tool", name: "structured_output" },
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      throw new Error("No structured output block in response");
    }
    return block.input as T;
  }
}
