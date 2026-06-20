import { ProblemInput, Clarification } from "../types";

export interface ComplexitySignals {
  systemsTouched: string[];
  migrationRisk: "low" | "medium" | "high";
  authDataImplications: string[];
}

export interface SolutionOption {
  title: string;
  coreApproach: string;
  tradeoffs: string[];
  complexitySignals: ComplexitySignals;
  bestFitWhen: string;
  // True for the single option that clearly dominates given the constraints.
  // At most one option in a set should be recommended; when the choice is a
  // genuine judgment call with no dominant answer, every option is false.
  recommended: boolean;
  // Only meaningful when `recommended` is true: why this approach dominates and
  // why the alternatives don't hold up. Empty string otherwise.
  recommendationRationale: string;
}

export interface SolutionSet {
  solutions: SolutionOption[];
}

export interface SolutionGenerationOptions {
  refineInput?: string;
  previousOptions?: { title: string; coreApproach: string }[];
}

export function buildSolutionGenerationPrompt(
  input: ProblemInput,
  clarifications: Clarification[],
  options: SolutionGenerationOptions = {}
): string {
  const clarificationText =
    clarifications.length > 0
      ? clarifications
          .filter((c) => c.answer)
          .map((c, i) => `Q${i + 1}: ${c.question}\nA${i + 1}: ${c.answer}`)
          .join("\n\n")
      : "No clarifications collected.";

  const refineSection =
    options.refineInput || (options.previousOptions?.length ?? 0) > 0
      ? `\n## Regeneration Context\n\nThe user already saw the option set below and is asking for a fresh take. Generate a NEW set of options that are genuinely different from these — not minor variations.\n\n${
          options.previousOptions?.length
            ? options.previousOptions
                .map(
                  (o, i) =>
                    `Previous Option ${i + 1}: ${o.title}\n  ${o.coreApproach}`
                )
                .join("\n\n")
            : ""
        }${
          options.refineInput
            ? `\n\nThe user added this additional context to guide the new set:\n"${options.refineInput.trim()}"\n\nWeight the new options towards this input.`
            : ""
        }\n`
      : "";

  const techStack = input.techStack?.trim();
  const currentArchitecture = input.currentArchitecture?.trim();
  const hasExistingSystem = Boolean(techStack || currentArchitecture);

  const existingSystemSection = `## The Existing System (land the feature HERE — do not design greenfield)\n\n**Existing Tech Stack:**\n${techStack || "Not explicitly provided."}\n\n**Current Architecture (where this feature must land):**\n${currentArchitecture || "Not explicitly provided."}`;

  // The #1 piece of feedback: options read like greenfield designs and ignore
  // the stack/architecture the work actually lands in. This section makes
  // "fit the existing system" a hard requirement, with an explicit fallback for
  // when that context is thin (state assumptions instead of inventing a stack).
  const groundingSection = hasExistingSystem
    ? `## Critical Requirement: Ground Every Option in the Existing System\n\nThis is NOT a greenfield project. Each option must be a realistic way to land this feature in the system described above. Specifically, every option MUST:\n1. Name the actual technologies, services, and components in play (from the stack/architecture above) — never invent a generic stack or assume tools that aren't mentioned.\n2. State explicitly what it reuses or extends in the current architecture vs. what genuinely new infrastructure/services it introduces. New infra is sometimes right, but it must be called out as a deliberate addition, not a default.\n3. Respect the current architecture's grain. Prefer approaches that fit how the system is already built; only propose replacing or re-architecting an existing component when the problem truly demands it — and when you do, flag it loudly as the cost it is.\n4. In complexitySignals.systemsTouched, list the REAL components from the architecture above that this approach modifies.\n\nA greenfield-sounding option (e.g. "stand up a new microservice with Kafka" when the system is a Rails monolith on Postgres with no streaming infra) is a FAILED option unless the problem explicitly calls for that level of change.`
    : `## Critical Requirement: Don't Silently Assume Greenfield\n\nThe team did not fully describe the existing stack or architecture, but unless the problem statement explicitly says this is a brand-new from-scratch build, assume the feature lands in an EXISTING system. For each option:\n1. State the key assumption it makes about the existing stack/architecture (e.g. "Assumes a relational primary datastore and a single deployable web app").\n2. Prefer approaches that integrate with a typical existing system over ones that require standing up large new platforms.\n3. If an option only makes sense for a true greenfield build, say so explicitly in bestFitWhen.\nDo not fabricate specific technologies the team never mentioned as though they were facts.`;

  return `You are a senior engineering architect generating genuinely different solution approaches for a complex engineering problem. Your goal is to surface the real decision space — 1 to 4 options that each genuinely earn their place — while landing the feature in the system the team actually has, not an idealized blank slate.${refineSection}\n\n## The Problem\n\n**Problem Statement:**\n${input.problemStatement}\n\n**Definition of Done:**\n${input.definitionOfDone}\n\n**Known Constraints:**\n${input.constraints}\n\n**Engineering Capacity:**\n${input.engineeringCapacity}\n\n**Non-Negotiables:**\n${input.nonNegotiables}\n\n${existingSystemSection}\n\n## Clarifications\n\n${clarificationText}\n\n${groundingSection}\n\n## How Many Options — and Never Pad with Strawmen\n\nGenerate between 1 and 4 options. The right number is however many approaches are *genuinely viable* for THIS problem and system — no more, no less. Do NOT manufacture alternatives to hit a quota: a real option set with two strong approaches is far more useful than a set padded out to four with two strawmen, which only blurs the real choice.\n\nSometimes one approach clearly dominates — it best satisfies the constraints, non-negotiables, and existing architecture, and the alternatives are meaningfully worse on dimensions the team has said they care about. When that is genuinely the case:\n- Return that single option (or that option plus only the alternatives a thoughtful engineer would still seriously weigh).\n- Set its \`recommended\` field to true and use \`recommendationRationale\` to explain BOTH why it dominates AND why the obvious alternatives don't hold up here — so the reader sees the alternatives were considered and rejected on the merits, not ignored.\n\nWhen it is a genuine judgment call with no dominant answer (the usual case for hard problems), return the full set of viable options and set \`recommended\` to false on every one — do not crown a winner just to have one. Forcing a recommendation where none exists is as misleading as padding with strawmen.\n\nRules for the recommendation signal:\n- At most ONE option may have \`recommended: true\`.\n- A single-option set does not have to be recommended — only set it true if that one approach genuinely dominates the space (vs. merely being the only one you generated).\n- For every option where \`recommended\` is false, set \`recommendationRationale\` to an empty string.\n\n## Critical Requirement: Genuine Divergence (when there is more than one option)\n\nDivergence and existing-system grounding are NOT in tension: the options should differ in *how they integrate with the system you were given*, not by each inventing a different stack. Each solution MUST diverge on at least one of these dimensions:\n1. **Architectural pattern** — monolith vs. microservice, sync vs. async, event-driven vs. request-response, CQRS vs. simple CRUD\n2. **Build vs. buy** — custom implementation vs. managed service vs. off-the-shelf product\n3. **Scope of change** — surgical fix vs. incremental migration vs. full replacement vs. strangler fig\n4. **Sequencing strategy** — big bang vs. phased rollout vs. parallel run vs. feature flag rollout\n\nA bad option set: "Option A: Use Redis", "Option B: Use Redis with a connection pool", "Option C: Use Redis Cluster" — these are the same approach at different scales.\n\nA good option set for "our search is slow":\n- Option A: Add Elasticsearch alongside Postgres (build-vs-buy + new architectural layer)\n- Option B: Rewrite queries and add targeted indexes, no new infra (surgical scope)\n- Option C: Move to a managed search-as-a-service (Algolia/Typesense) (full buy)\n- Option D: Materialize search-optimized read models via event sourcing (architectural pattern change)\n\n## Few-Shot Examples of Good Divergent Option Sets\n\n### Example Problem: "Our deployment pipeline takes 45 minutes and is blocking teams"\n\n**Option 1 — Surgical optimization (scope: targeted, build)**\nTitle: "Parallelized pipeline with caching"\nCore Approach: Audit the pipeline stages, introduce parallel test execution, aggressive dependency caching, and optimized Docker layer ordering. No new tooling.\n\n**Option 2 — Buy a managed CI platform (build-vs-buy)**\nTitle: "Migrate to managed CI (GitHub Actions / Buildkite)"\nCore Approach: Abandon the current pipeline entirely. Migrate to a platform with built-in parallelism, caching infrastructure, and ephemeral runners. Faster time-to-improvement at the cost of vendor dependency.\n\n**Option 3 — Architectural: trunk-based dev + feature flags (pattern change)**\nTitle: "Trunk-based development with runtime feature flags"\nCore Approach: The pipeline is slow because large branches accumulate many changes. Move to trunk-based development with feature flags. Small, frequent commits mean the pipeline runs on less code per run — faster by reducing the problem, not the pipeline.\n\n**Option 4 — Split pipeline architecture (scope: incremental)**\nTitle: "Tiered pipeline: fast path + async full suite"\nCore Approach: Create a fast-path pipeline (unit tests + lint, ~5 min) that gates merges, and run the full suite asynchronously. Teams unblock on the fast path; full suite failures trigger a revert or async fix.\n\n---\n\n### Example Problem: "We need to add multi-tenancy to our single-tenant SaaS"\n\n**Option 1 — Schema-per-tenant isolation (architectural pattern)**\nTitle: "Database schema isolation per tenant"\nCore Approach: Add a schema prefix to every query; each tenant gets their own Postgres schema. Strong isolation, no data leakage risk, harder to query across tenants for analytics.\n\n**Option 2 — Row-level security via tenant_id (scope: surgical)**\nTitle: "Shared schema with row-level security"\nCore Approach: Add tenant_id to every table, enforce RLS policies in Postgres. Minimal structural change, fastest to ship, requires rigorous policy testing to prevent data leakage.\n\n**Option 3 — Silo deployment model (scope: full replacement)**\nTitle: "Per-tenant deployment silos"\nCore Approach: Each tenant runs their own instance (separate deploy, separate DB). Maximum isolation and customizability. Very high operational overhead; appropriate only if tenants have strict compliance requirements.\n\n**Option 4 — Buy a multi-tenancy framework (build-vs-buy)**\nTitle: "Adopt a multi-tenancy framework (e.g., Nile, Supabase)"\nCore Approach: Use a purpose-built multi-tenant database platform that handles isolation, provisioning, and routing as a managed service. Fastest path to correct isolation guarantees; introduces a platform dependency.\n\n---\n\n## Now Generate Solutions for This Problem\n\nProduce between 1 and 4 genuinely viable solutions (see the guidance above on count and when to recommend one). For each, fill in all required fields in the structured output.\n\nFor the tradeoffs array: list 3-5 concrete, honest tradeoffs — both pros and cons. Be specific, not generic ("introduces operational complexity" is too vague; "adds a new Kafka cluster to operate and monitor" is concrete).\n\nFor complexitySignals.systemsTouched: list the actual systems this approach would modify.\nFor complexitySignals.authDataImplications: note any implications for user data, sessions, permissions, or auth flows. If none, say "None — this approach does not touch auth or user data."\nFor complexitySignals.migrationRisk: be honest. "Low" means existing systems keep working with no transition period. "High" means there's a cutover, dual-write period, or significant rollback complexity.\n\nFor bestFitWhen: describe the team/context where this approach is the right call. Be specific — "when the team has <2 engineers available and needs to ship in 2 weeks" is useful. "When you want simplicity" is not.`;
}

/**
 * Defensively enforce the "at most one recommended option" invariant the prompt
 * asks for. The model can occasionally flag more than one (or attach a rationale
 * to a non-recommended option); we keep only the first recommendation and clear
 * the rationale everywhere else so the UI and decision brief stay coherent.
 */
export function normalizeRecommendations(
  options: SolutionOption[]
): SolutionOption[] {
  let alreadyRecommended = false;
  return options.map((o) => {
    const isRecommended = o.recommended === true && !alreadyRecommended;
    if (isRecommended) alreadyRecommended = true;
    return {
      ...o,
      recommended: isRecommended,
      recommendationRationale: isRecommended
        ? (o.recommendationRationale ?? "").trim()
        : "",
    };
  });
}

export const solutionGenerationResponseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "generate_solutions",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        solutions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              coreApproach: { type: "string" },
              tradeoffs: {
                type: "array",
                items: { type: "string" },
              },
              complexitySignals: {
                type: "object",
                additionalProperties: false,
                properties: {
                  systemsTouched: {
                    type: "array",
                    items: { type: "string" },
                  },
                  migrationRisk: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                  },
                  authDataImplications: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "systemsTouched",
                  "migrationRisk",
                  "authDataImplications",
                ],
              },
              bestFitWhen: { type: "string" },
              recommended: { type: "boolean" },
              recommendationRationale: { type: "string" },
            },
            required: [
              "title",
              "coreApproach",
              "tradeoffs",
              "complexitySignals",
              "bestFitWhen",
              "recommended",
              "recommendationRationale",
            ],
          },
        },
      },
      required: ["solutions"],
    },
  },
};
