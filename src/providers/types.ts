export type JSONSchema = Record<string, unknown>;

export interface ModelProvider {
  complete(prompt: string): Promise<string>;
  completeStructured<T>(prompt: string, schema: JSONSchema): Promise<T>;
}
