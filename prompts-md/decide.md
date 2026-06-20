# Decide Stage Prompt

**Placeholders to fill in before sending:**

| Placeholder | Description |
|-------------|-------------|
| `{{PROJECT_TITLE}}` | Name of the project or decision |
| `{{DECISION_DATE}}` | Today's date (YYYY-MM-DD) |
| `{{PROBLEM_STATEMENT}}` | From the Frame stage |
| `{{DEFINITION_OF_DONE}}` | From the Frame stage |
| `{{CONSTRAINTS}}` | From the Frame stage |
| `{{ENGINEERING_CAPACITY}}` | From the Frame stage |
| `{{NON_NEGOTIABLES}}` | From the Frame stage |
| `{{TECH_STACK}}` | From the Frame stage (or "Not provided.") |
| `{{CURRENT_ARCHITECTURE}}` | From the Frame stage (or "Not provided.") |
| `{{CLARIFICATIONS}}` | Answered Q&A pairs from the Clarify stage, or "No clarifications collected." |
| `{{SELECTED_TITLE}}` | Title of the chosen option |
| `{{SELECTED_CORE_APPROACH}}` | Core approach of the chosen option |
| `{{SELECTED_TRADEOFFS}}` | Tradeoffs of the chosen option, as a bullet list |
| `{{SELECTED_SYSTEMS_TOUCHED}}` | From complexitySignals.systemsTouched, comma-separated |
| `{{SELECTED_MIGRATION_RISK}}` | low / medium / high |
| `{{SELECTED_AUTH_DATA}}` | From complexitySignals.authDataImplications, semicolon-separated |
| `{{SELECTED_BEST_FIT_WHEN}}` | bestFitWhen field of the chosen option |
| `{{TEAM_RATIONALE}}` | The team's one-paragraph explanation of why they chose this option |
| `{{RECOMMENDATION_ALIGNMENT}}` | Optional note if the chosen option differs from the one flagged recommended. Leave blank if they match or if no option was recommended |
| `{{OTHER_OPTIONS}}` | The options that were NOT chosen. Format each as: `### Option N: <title>\n<coreApproach>` |

**Output:** The model returns the complete Decision Brief as Markdown. No JSON schema needed — this is free-form text.

---

## Prompt

You are a technical writer helping an engineering team create a permanent record of a decision. Generate a professional, concise Decision Brief in Markdown format.

## Context

**Project:** {{PROJECT_TITLE}}
**Decision Date:** {{DECISION_DATE}}

### Problem Statement
{{PROBLEM_STATEMENT}}

### Definition of Done
{{DEFINITION_OF_DONE}}

### Constraints
{{CONSTRAINTS}}

### Engineering Capacity
{{ENGINEERING_CAPACITY}}

### Non-Negotiables
{{NON_NEGOTIABLES}}

### Existing Tech Stack
{{TECH_STACK}}

### Current Architecture (where this feature lands)
{{CURRENT_ARCHITECTURE}}

### Clarifications
{{CLARIFICATIONS}}

### Selected Solution: {{SELECTED_TITLE}}

**Core Approach:**
{{SELECTED_CORE_APPROACH}}

**Tradeoffs:**
{{SELECTED_TRADEOFFS}}

**Complexity Signals:**
- Systems Touched: {{SELECTED_SYSTEMS_TOUCHED}}
- Migration Risk: {{SELECTED_MIGRATION_RISK}}
- Auth/Data Implications: {{SELECTED_AUTH_DATA}}

**Best Fit When:** {{SELECTED_BEST_FIT_WHEN}}

### Team's Rationale for This Choice
{{TEAM_RATIONALE}}
{{RECOMMENDATION_ALIGNMENT}}

### Other Options Considered
{{OTHER_OPTIONS}}

## Instructions

Generate a Decision Brief with the following sections. Write in past tense for the problem context, present/future tense for the decision and next steps.

1. **Header** — Title (from project), date, status: "Decided"
2. **TL;DR** — 2-3 sentence executive summary of the problem and decision
3. **Problem** — Clear description of what was wrong and why it needed solving
4. **Definition of Done** — What success looks like
5. **Constraints & Non-Negotiables** — The hard limits on any solution
6. **Existing System & Integration** — The stack and current architecture this lands in, and how the chosen approach fits into / extends it. Omit only if explicitly greenfield with no existing system.
7. **Options Considered** — Brief summary of all options evaluated (including those not chosen)
8. **Decision** — The chosen approach with full description
9. **Rationale** — Why this option was selected, incorporating the team's stated reasoning and connecting it to constraints, existing architecture, and clarifications
10. **Key Tradeoffs Accepted** — Honest acknowledgment of what's being traded away
11. **Complexity & Risk** — Migration risk, systems affected, any auth/data concerns
12. **Next Steps** — 3-5 concrete action items implied by this decision
13. **Open Questions** — 2-3 questions that remain unanswered and should be resolved during implementation

The brief should be professional but not bureaucratic. Useful to someone who wasn't in the room. Target length: 600-900 words.

Return ONLY the Markdown content. No preamble, no explanation.
