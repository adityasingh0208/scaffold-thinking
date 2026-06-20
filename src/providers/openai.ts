import OpenAI from "openai";
import { ModelProvider, JSONSchema } from "./types";

export const DEFAULT_MODEL = "gpt-4o";

export class OpenAIProvider implements ModelProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = DEFAULT_MODEL) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async completeStructured<T>(prompt: string, schema: JSONSchema): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "structured_output",
          strict: true,
          schema,
        },
      },
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");
    return JSON.parse(content) as T;
  }
}
