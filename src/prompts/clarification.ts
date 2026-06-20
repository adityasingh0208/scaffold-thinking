import { ProblemInput } from "../types";

export interface ClarificationQuestion {
  question: string;
  rationale: string;
}

export function buildClarificationPrompt(input: ProblemInput): string {
  const techStack = input.techStack?.trim();
  const currentArchitecture = input.currentArchitecture?.trim();

  const existingSystemSection = `**Existing Tech Stack:**
${techStack || "Not provided."}

**Current Architecture (where this feature must land):**
${currentArchitecture || "Not provided."}`;

  // When the team hasn't described the system this work lands in, the single
  // most decision-relevant unknown is the existing architecture itself — not
  // scale or timeline. Force a probe so we never silently assume a greenfield
  // build.
  const missingArchitecture = !techStack || !currentArchitecture;
  const architectureRule = missingArchitecture
    ? `\n\n## Critical: Don't Assume Greenfield\n\nThe team has NOT fully described the system this work lands in (tech stack and/or current architecture are missing). Unless the problem statement makes it explicit that this is a brand-new, from-scratch (greenfield) build, AT LEAST ONE of your questions MUST surface the existing system: what it's built on (languages, frameworks, datastores, infra) and where exactly this feature would integrate. A solution that fits a greenfield repo is usually wrong for a system that already exists — so this is the highest-value thing to clarify.`
    : "";

  return `You are a senior engineering advisor helping a team think through a complex problem before committing to a solution. Your job is to identify the 2-4 most important clarifying questions that would materially change which solution approach is recommended.

## Problem Context

**Problem Statement:**
${input.problemStatement}

**Definition of Done:**
${input.definitionOfDone}

**Known Constraints:**
${input.constraints}

**Engineering Capacity:**
${input.engineeringCapacity}

**Non-Negotiables:**
${input.nonNegotiables}

${existingSystemSection}${architectureRule}

## Your Task

Generate 2-4 targeted clarifying questions. Each question must:
1. Be genuinely decision-relevant — the answer must change which approach you'd recommend
2. Target a specific unknown that isn't already addressed in the problem context
3. Avoid open-ended "tell me more" questions — be precise and purposeful
4. Focus on one of: existing system topology and how the feature integrates with it, scale/load expectations, team capability constraints, timeline pressures, or downstream dependencies

Do NOT ask about things already stated in the constraints, non-negotiables, tech stack, or current architecture.

## Good Examples of Clarifying Questions

For a "we need to migrate our auth system" problem:
- "Do any third-party integrations currently rely on your session token format, or do all consumers go through your own API layer?" (Answer changes whether you can do a clean cutover vs. dual-write period)
- "Is the existing auth system a shared service across multiple products or owned by a single team?" (Answer changes scope of coordination required)

For a "our search is too slow" problem:
- "Is the slowness uniformly distributed or tied to specific query patterns (e.g., faceted filters, full-text, range queries)?" (Answer changes whether you need a different data store vs. better indexing)
- "Can you accept eventual consistency in search results, or must newly written records be immediately searchable?" (Answer determines whether you can introduce async indexing)

## Output Format

Return a JSON array of objects. Each object must have exactly these fields:
- "question": the clarifying question (1-2 sentences, specific and actionable)
- "rationale": why this question matters / how the answer changes the recommended approach (1 sentence)

Return ONLY the JSON array. No markdown, no preamble, no explanation outside the JSON.`;
}

export const clarificationResponseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "generate_clarifying_questions",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              question: { type: "string" },
              rationale: { type: "string" },
            },
            required: ["question", "rationale"],
          },
        },
      },
      required: ["questions"],
    },
  },
};
