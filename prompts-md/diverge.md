# Diverge Stage Prompt

**Placeholders to fill in before sending:**

| Placeholder | Description |
|-------------|-------------|
| `{{PROBLEM_STATEMENT}}` | From the Frame stage |
| `{{DEFINITION_OF_DONE}}` | From the Frame stage |
| `{{CONSTRAINTS}}` | From the Frame stage |
| `{{ENGINEERING_CAPACITY}}` | From the Frame stage |
| `{{NON_NEGOTIABLES}}` | From the Frame stage |
| `{{TECH_STACK}}` | From the Frame stage |
| `{{CURRENT_ARCHITECTURE}}` | From the Frame stage |
| `{{CLARIFICATIONS}}` | Q&A pairs from the Clarify stage. Format each as: `Q1: <question>\nA1: <answer>`. Write "No clarifications collected." if skipped |
| `{{REGENERATION_CONTEXT}}` | Only needed on a re-run. List previous option titles + core approaches and tell the model to produce a genuinely different set. Leave blank on first run |

---

## Prompt

You are a senior engineering architect generating genuinely different solution approaches for a complex engineering problem. Your goal is to surface the real decision space — 1 to 4 options that each genuinely earn their place — while landing the feature in the system the team actually has, not an idealized blank slate.
{{REGENERATION_CONTEXT}}

## The Problem

**Problem Statement:**
{{PROBLEM_STATEMENT}}

**Definition of Done:**
{{DEFINITION_OF_DONE}}

**Known Constraints:**
{{CONSTRAINTS}}

**Engineering Capacity:**
{{ENGINEERING_CAPACITY}}

**Non-Negotiables:**
{{NON_NEGOTIABLES}}

## The Existing System (land the feature HERE — do not design greenfield)

**Existing Tech Stack:**
{{TECH_STACK}}

**Current Architecture (where this feature must land):**
{{CURRENT_ARCHITECTURE}}

## Clarifications

{{CLARIFICATIONS}}

## Critical Requirement: Ground Every Option in the Existing System

This is NOT a greenfield project. Each option must be a realistic way to land this feature in the system described above. Specifically, every option MUST:
1. Name the actual technologies, services, and components in play — never invent a generic stack or assume tools that aren't mentioned.
2. State explicitly what it reuses or extends in the current architecture vs. what genuinely new infrastructure/services it introduces.
3. Respect the current architecture's grain. Only propose replacing or re-architecting an existing component when the problem truly demands it — and flag it loudly as the cost it is.
4. In complexitySignals.systemsTouched, list the REAL components from the architecture above that this approach modifies.

## How Many Options — and Never Pad with Strawmen

Generate between 1 and 4 options. The right number is however many approaches are *genuinely viable* for THIS problem and system — no more, no less. Do NOT manufacture alternatives to hit a quota.

Sometimes one approach clearly dominates. When that is genuinely the case, set its `recommended` field to true and use `recommendationRationale` to explain BOTH why it dominates AND why the obvious alternatives don't hold up. When it is a genuine judgment call, set `recommended` to false on every option.

Rules for the recommendation signal:
- At most ONE option may have `recommended: true`.
- For every option where `recommended` is false, set `recommendationRationale` to an empty string.

## Critical Requirement: Genuine Divergence (when there is more than one option)

Each solution MUST diverge on at least one of these dimensions:
1. **Architectural pattern** — monolith vs. microservice, sync vs. async, event-driven vs. request-response, CQRS vs. simple CRUD
2. **Build vs. buy** — custom implementation vs. managed service vs. off-the-shelf product
3. **Scope of change** — surgical fix vs. incremental migration vs. full replacement vs. strangler fig
4. **Sequencing strategy** — big bang vs. phased rollout vs. parallel run vs. feature flag rollout

**Bad option set:** "Use Redis", "Use Redis with a connection pool", "Use Redis Cluster" — same approach at different scales.

**Good option set for "our search is slow":**
- Add Elasticsearch alongside Postgres (build-vs-buy + new architectural layer)
- Rewrite queries and add targeted indexes, no new infra (surgical scope)
- Move to managed search-as-a-service like Algolia (full buy)
- Materialize search-optimized read models via event sourcing (architectural pattern change)

## Few-Shot Examples of Good Divergent Option Sets

### Example: "Our deployment pipeline takes 45 minutes and is blocking teams"

**Option 1 — Surgical optimization**
Title: "Parallelized pipeline with caching"
Core: Audit pipeline stages, introduce parallel test execution, aggressive dependency caching, optimized Docker layer ordering. No new tooling.

**Option 2 — Buy a managed CI platform**
Title: "Migrate to managed CI (GitHub Actions / Buildkite)"
Core: Abandon the current pipeline. Migrate to a platform with built-in parallelism, caching infrastructure, and ephemeral runners.

**Option 3 — Architectural: trunk-based dev + feature flags**
Title: "Trunk-based development with runtime feature flags"
Core: The pipeline is slow because large branches accumulate many changes. Move to trunk-based development with feature flags. Small, frequent commits mean less code per run.

**Option 4 — Split pipeline architecture**
Title: "Tiered pipeline: fast path + async full suite"
Core: Create a fast-path pipeline (~5 min) that gates merges, run the full suite asynchronously. Teams unblock on the fast path.

---

### Example: "We need to add multi-tenancy to our single-tenant SaaS"

**Option 1 — Schema-per-tenant isolation**
Title: "Database schema isolation per tenant"
Core: Add a schema prefix to every query; each tenant gets their own Postgres schema. Strong isolation, no data leakage risk.

**Option 2 — Row-level security via tenant_id**
Title: "Shared schema with row-level security"
Core: Add tenant_id to every table, enforce RLS policies in Postgres. Minimal structural change, fastest to ship.

**Option 3 — Silo deployment model**
Title: "Per-tenant deployment silos"
Core: Each tenant runs their own instance. Maximum isolation. Very high operational overhead.

**Option 4 — Buy a multi-tenancy framework**
Title: "Adopt a multi-tenancy platform (e.g., Nile, Supabase)"
Core: Use a purpose-built multi-tenant database platform. Fastest path to correct isolation guarantees; introduces a platform dependency.

---

## Now Generate Solutions

Produce between 1 and 4 genuinely viable solutions. For each:

- **tradeoffs**: 3-5 concrete, honest tradeoffs (both pros and cons). Be specific — "adds a new Kafka cluster to operate and monitor," not "introduces operational complexity."
- **complexitySignals.systemsTouched**: the actual systems this approach modifies.
- **complexitySignals.authDataImplications**: any implications for user data, sessions, permissions, or auth flows. If none: "None — this approach does not touch auth or user data."
- **complexitySignals.migrationRisk**: "low" = existing systems keep working with no transition. "high" = cutover, dual-write, or significant rollback complexity.
- **bestFitWhen**: specific team/context. "When the team has <2 engineers and needs to ship in 2 weeks" is useful. "When you want simplicity" is not.

---

## JSON Schema (for structured output APIs)

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "solutions": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "title": { "type": "string" },
          "coreApproach": { "type": "string" },
          "tradeoffs": { "type": "array", "items": { "type": "string" } },
          "complexitySignals": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "systemsTouched": { "type": "array", "items": { "type": "string" } },
              "migrationRisk": { "type": "string", "enum": ["low", "medium", "high"] },
              "authDataImplications": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["systemsTouched", "migrationRisk", "authDataImplications"]
          },
          "bestFitWhen": { "type": "string" },
          "recommended": { "type": "boolean" },
          "recommendationRationale": { "type": "string" }
        },
        "required": ["title", "coreApproach", "tradeoffs", "complexitySignals", "bestFitWhen", "recommended", "recommendationRationale"]
      }
    }
  },
  "required": ["solutions"]
}
```
