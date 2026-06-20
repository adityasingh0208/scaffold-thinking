# scaffold-thinking

Four-stage thinking layer that turns a vague engineering problem into genuinely different solution options + a Markdown decision brief.

**Frame → Clarify → Diverge → Decide**

Provider-agnostic. Default: Claude. Also works with OpenAI.

---

## The problem it solves

Ask any language model for "a few options" and it gives you the same option at three resolutions. For "our search is slow" you get: use Redis. Use Redis with a connection pool. Use Redis Cluster. Three answers, one idea.

`scaffold-thinking` forces divergence by:

1. **Naming the axes** solutions are allowed to differ on — architectural pattern, build-vs-buy, scope of change, sequencing strategy
2. **Showing the model the bad answer explicitly** ("don't give me Redis three times") rather than asking harder for a good one
3. **Using JSON schema as a second forcing function** — requiring `migrationRisk` as an enum and `systemsTouched` as a concrete list makes it expensive for the model to be vague
4. **Feeding previous titles into regeneration** so a re-run can't repeat the first set

---

## Install

```bash
npm install scaffold-thinking
```

---

## Quick start

```ts
import { clarify, diverge, decide, AnthropicProvider } from "scaffold-thinking";

const provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY!);

// Stage 2: generate decision-relevant clarifying questions
const questions = await clarify(input, provider);

// Stage 3: generate 1-4 genuinely different options
const solutions = await diverge(input, answeredClarifications, provider);

// Stage 4: generate a Markdown decision brief
const brief = await decide({ projectTitle, input, clarifications, allSolutions: solutions, selectedSolution, rationale }, provider);
```

See [`examples/basic.ts`](examples/basic.ts) for a complete end-to-end example.

---

## CLI

Run a problem through all four stages interactively:

```bash
npx scaffold-thinking run
```

The CLI walks you through Frame (5 fields), Clarify (answers the questions), Diverge (displays the options), and Decide (picks one and generates the brief). The brief is written to stdout — pipe it to a file.

```bash
ANTHROPIC_API_KEY=sk-ant-... npx scaffold-thinking run > decision.md
```

To use OpenAI instead:

```bash
OPENAI_API_KEY=sk-... npx scaffold-thinking run --provider openai
```

---

## Providers

### Anthropic (default)

```ts
import { AnthropicProvider } from "scaffold-thinking";

const provider = new AnthropicProvider(
  process.env.ANTHROPIC_API_KEY!,
  "claude-opus-4-8" // optional — this is the default
);
```

### OpenAI

```ts
import { OpenAIProvider } from "scaffold-thinking/providers/openai";

const provider = new OpenAIProvider(
  process.env.OPENAI_API_KEY!,
  "gpt-4o" // optional — this is the default
);
```

### Bring your own

Implement the `ModelProvider` interface to use any LLM:

```ts
import type { ModelProvider, JSONSchema } from "scaffold-thinking";

class MyProvider implements ModelProvider {
  async complete(prompt: string): Promise<string> { /* ... */ }
  async completeStructured<T>(prompt: string, schema: JSONSchema): Promise<T> { /* ... */ }
}
```

---

## The four stages

### Stage 1 — Frame

Five fields that are the entire forcing function for the human side:

| Field | Why it matters |
|-------|---------------|
| `problemStatement` | Forces the "what is actually broken" to be stated |
| `definitionOfDone` | If you can't fill this in, you don't have a problem yet |
| `constraints` | Hard limits that any solution must respect |
| `engineeringCapacity` | Rules out options that don't fit the team |
| `nonNegotiables` | The bright lines — things that don't change regardless of approach |

Plus two optional fields (`techStack`, `currentArchitecture`) that ground solutions in the system the work actually lands in. When omitted, the Clarify stage asks at least one question to surface the existing system rather than silently assuming greenfield.

### Stage 2 — Clarify

`clarify(input, provider)` → `ClarificationQuestion[]`

Generates 2-4 questions where the answer to each one changes which approach gets recommended. No "tell me more about your goals." A question only earns its place if the fork it reveals matters.

### Stage 3 — Diverge

`diverge(input, clarifications, provider, options?)` → `SolutionOption[]`

Generates 1-4 genuinely different options. Options diverge on at least one of the four axes. The count is honest — a 2-option set where both are real beats a 4-option set padded with strawmen.

Pass `options.previousOptions` on a re-run to feed previous titles back in. The model is told explicitly not to repeat them — divergence enforced across calls, not just within one.

Each option includes:
- `title` + `coreApproach` — what the option is
- `tradeoffs[]` — concrete pros and cons (specific, not generic)
- `complexitySignals.migrationRisk` — `"low" | "medium" | "high"`
- `complexitySignals.systemsTouched` — the actual components this approach modifies
- `complexitySignals.authDataImplications` — any auth or data concerns
- `bestFitWhen` — the team/context where this is the right call
- `recommended` + `recommendationRationale` — set only when one option clearly dominates

### Stage 4 — Decide

`decide(context, provider)` → `string` (Markdown)

Takes the selected option and the team's rationale, produces a 600-900 word decision brief covering: TL;DR, problem, options considered, decision, rationale, tradeoffs accepted, complexity & risk, next steps, open questions.

The brief is the durable artifact — designed to be useful to someone who wasn't in the room, six months later.

---

## Without code: raw prompt files

If you want the prompt architecture without the npm dependency, see [`prompts-md/`](prompts-md/). These are the stage prompts as plain Markdown with `{{PLACEHOLDER}}` notation — copy them into a `CLAUDE.md`, Cursor `.cursorrules`, or any LLM chat interface.

---

## Divergence benchmark

The eval in [`examples/eval.ts`](examples/eval.ts) feeds three representative problems through the pipeline and asserts:

- **Divergence score ≥ 3.0** (unique signals per option, averaged)
- **Migration risk variety** — at least 2 distinct values across options
- **All titles distinct**
- **Each option has ≥ 3 tradeoffs**
- **Options grounded in the existing stack** — not greenfield drift

Run it against your own provider:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run eval
```

---

## Background

This is the thinking layer extracted from [Scaffold](https://github.com/adityasingh0208/scaffold), a private web app. The post ["Scaffold: Teaching a Model to Disagree With Itself"](https://adityasingh.dev/posts/scaffold-thinking-layer) covers the design decisions behind the prompt architecture.

The thesis: **the model is a commodity. The intake is the product.**

---

## License

MIT
