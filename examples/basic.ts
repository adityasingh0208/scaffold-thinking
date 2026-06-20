/**
 * Basic end-to-end example: one problem through all four stages.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx examples/basic.ts
 */
import { clarify, diverge, decide, AnthropicProvider } from "../src/index";
import type { ProblemInput, Clarification } from "../src/types";

async function main() {
  const provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY!);

  const input: ProblemInput = {
    id: "example-1",
    projectId: "example-project",
    problemStatement:
      "Our monolithic Rails app takes 18+ minutes to run the full test suite, blocking engineers from getting timely CI feedback and slowing our release cadence from daily to 2-3 deploys per week.",
    definitionOfDone:
      "CI feedback available within 8 minutes for any PR. Daily deploy cadence restored.",
    constraints:
      "Rails 6.1 with RSpec (~4,000 examples, 350 spec files). CI runs on GitHub Actions standard 2-core runners. No budget for premium runners right now.",
    engineeringCapacity: "1 senior engineer, 50% time, 3 weeks",
    nonNegotiables:
      "Must not remove test coverage. Cannot change CI provider (GitHub Actions). All PRs must pass the full suite before merge.",
    techStack: "Rails 6.1 monolith, RSpec, CI on GitHub Actions standard 2-core runners.",
    currentArchitecture:
      "Single Rails monolith. CI runs the full RSpec suite on every PR; the suite is not parallelized today.",
    createdAt: new Date(),
  };

  console.log("Stage 2 — Clarify: generating questions...");
  const questions = await clarify(input, provider);
  console.log(`Generated ${questions.length} clarifying questions:`);
  questions.forEach((q, i) => console.log(`  Q${i + 1}: ${q.question}`));

  const clarifications: Clarification[] = questions.map((q, i) => ({
    id: `q-${i}`,
    projectId: input.projectId,
    question: q.question,
    answer: "For this example, assume a typical mid-size startup with standard practices.",
    order: i,
    createdAt: new Date(),
  }));

  console.log("\nStage 3 — Diverge: generating options...");
  const solutions = await diverge(input, clarifications, provider);
  console.log(`Generated ${solutions.length} options:`);
  solutions.forEach((s, i) => {
    const badge = s.recommended ? " ★" : "";
    console.log(`  ${i + 1}. ${s.title}${badge} (risk: ${s.complexitySignals.migrationRisk})`);
  });

  const selected = solutions[0];
  console.log(`\nStage 4 — Decide: generating brief for "${selected.title}"...`);
  const brief = await decide(
    {
      projectTitle: "Fix slow CI pipeline",
      input,
      clarifications,
      allSolutions: solutions,
      selectedSolution: selected,
      rationale: "Lowest risk and no new infrastructure required. We can ship within the 3-week window.",
    },
    provider
  );

  console.log("\n--- DECISION BRIEF ---\n");
  console.log(brief);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
