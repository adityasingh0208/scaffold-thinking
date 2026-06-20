import { ProblemInput, Clarification } from "../types";
import { SolutionOption } from "./solution-generation";

export interface DecisionContext {
  projectTitle: string;
  input: ProblemInput;
  clarifications: Clarification[];
  allSolutions: SolutionOption[];
  selectedSolution: SolutionOption;
  rationale: string;
}

export function buildDecisionCapturePrompt(ctx: DecisionContext): string {
  const clarificationText =
    ctx.clarifications.length > 0
      ? ctx.clarifications
          .filter((c) => c.answer)
          .map(
            (c, i) =>
              `**Q${i + 1}:** ${c.question}\n**A${i + 1}:** ${c.answer}`
          )
          .join("\n\n")
      : "No clarifications collected.";

  const rejectedSolutions = ctx.allSolutions
    .filter((s) => s.title !== ctx.selectedSolution.title)
    .map(
      (s, i) =>
        `### Option ${i + 1}: ${s.title}\n${s.coreApproach}\n\n**Why not chosen:** (to be inferred from selection rationale and context)`
    )
    .join("\n\n");

  const selectedSolution = ctx.selectedSolution;

  // Surface whether the team went with the system's recommended (dominant)
  // option or overrode it — the brief should be honest about either case.
  const recommendedOption = ctx.allSolutions.find((s) => s.recommended);
  const recommendationNote = recommendedOption
    ? recommendedOption.title === selectedSolution.title
      ? `\n### Recommendation Alignment\nThe chosen option was the one flagged as the clear fit during analysis.${
          recommendedOption.recommendationRationale
            ? ` Reasoning at the time: ${recommendedOption.recommendationRationale}`
            : ""
        }`
      : `\n### Recommendation Alignment\nAnalysis had flagged a different option ("${recommendedOption.title}") as the dominant one${
          recommendedOption.recommendationRationale
            ? ` (${recommendedOption.recommendationRationale})`
            : ""
        }, but the team chose "${selectedSolution.title}" instead. The rationale below should make clear why the team overrode that.`
    : "";

  return `You are a technical writer helping an engineering team create a permanent record of a decision. Generate a professional, concise Decision Brief in Markdown format.\n\n## Context\n\n**Project:** ${ctx.projectTitle}\n**Decision Date:** ${new Date().toISOString().split("T")[0]}\n\n### Problem Statement\n${ctx.input.problemStatement}\n\n### Definition of Done\n${ctx.input.definitionOfDone}\n\n### Constraints\n${ctx.input.constraints}\n\n### Engineering Capacity\n${ctx.input.engineeringCapacity}\n\n### Non-Negotiables\n${ctx.input.nonNegotiables}\n\n### Existing Tech Stack\n${ctx.input.techStack?.trim() || "Not provided."}\n\n### Current Architecture (where this feature lands)\n${ctx.input.currentArchitecture?.trim() || "Not provided."}\n\n### Clarifications\n${clarificationText}\n\n### Selected Solution: ${selectedSolution.title}\n\n**Core Approach:**\n${selectedSolution.coreApproach}\n\n**Tradeoffs:**\n${selectedSolution.tradeoffs.map((t) => `- ${t}`).join("\n")}\n\n**Complexity Signals:**\n- Systems Touched: ${selectedSolution.complexitySignals.systemsTouched.join(", ")}\n- Migration Risk: ${selectedSolution.complexitySignals.migrationRisk}\n- Auth/Data Implications: ${selectedSolution.complexitySignals.authDataImplications.join("; ") || "None"}\n\n**Best Fit When:** ${selectedSolution.bestFitWhen}\n\n### Team's Rationale for This Choice\n${ctx.rationale}\n${recommendationNote}\n\n### Other Options Considered\n${rejectedSolutions}\n\n## Instructions\n\nGenerate a Decision Brief with the following sections. Write in past tense for the problem context, present/future tense for the decision and next steps.\n\n1. **Header** — Title (from project), date, status: "Decided"\n2. **TL;DR** — 2-3 sentence executive summary of the problem and decision\n3. **Problem** — Clear description of what was wrong and why it needed solving\n4. **Definition of Done** — What success looks like\n5. **Constraints & Non-Negotiables** — The hard limits on any solution\n6. **Existing System & Integration** — The stack and current architecture this lands in, and how the chosen approach fits into / extends it. If the existing system wasn't described, say so and note any assumptions the decision rests on. Omit this section only if there is genuinely no existing-system context and the work is explicitly greenfield.\n7. **Options Considered** — Brief summary of all options evaluated (including the ones not chosen)\n8. **Decision** — The chosen approach with full description\n9. **Rationale** — Why this option was selected, incorporating the team's stated reasoning and connecting it to the constraints, existing architecture, and clarifications. If the "Recommendation Alignment" note above indicates the team overrode the analysis's dominant option, briefly and neutrally acknowledge that and the reasoning for going the other way.\n10. **Key Tradeoffs Accepted** — Honest acknowledgment of what's being traded away\n11. **Complexity & Risk** — Migration risk, systems affected, any auth/data concerns\n12. **Next Steps** — 3-5 concrete action items implied by this decision (infer from context)\n13. **Open Questions** — 2-3 questions that remain unanswered and should be resolved during implementation\n\nThe brief should be professional but not bureaucratic. It should be useful to someone who wasn't in the room — they should understand the full context, the options, and why this choice was made. Target length: 600-900 words.\n\nReturn ONLY the Markdown content. No preamble, no explanation.`;
}
