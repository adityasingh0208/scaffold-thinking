#!/usr/bin/env node
import * as readline from "readline";
import { clarify } from "../stages/clarify";
import { diverge } from "../stages/diverge";
import { decide } from "../stages/decide";
import { AnthropicProvider } from "../providers/anthropic";
import { OpenAIProvider } from "../providers/openai";
import type { ModelProvider } from "../providers/types";
import type { ProblemInput, Clarification } from "../types";
import type { SolutionOption } from "../prompts/solution-generation";

function makeProvider(): ModelProvider {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const providerFlag = process.argv.includes("--provider")
    ? process.argv[process.argv.indexOf("--provider") + 1]
    : null;

  if (providerFlag === "openai" || (!anthropicKey && openaiKey)) {
    if (!openaiKey) {
      console.error("OPENAI_API_KEY is required when using --provider openai");
      process.exit(1);
    }
    return new OpenAIProvider(openaiKey);
  }

  if (!anthropicKey) {
    console.error(
      "Set ANTHROPIC_API_KEY to use the default provider (Claude), or set OPENAI_API_KEY with --provider openai"
    );
    process.exit(1);
  }
  return new AnthropicProvider(anthropicKey);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function askMultiline(label: string): Promise<string> {
  return new Promise((resolve) => {
    console.log(`\n${label} (type END on a new line to finish):`);
    const lines: string[] = [];
    rl.on("line", function onLine(line) {
      if (line.trim() === "END") {
        rl.removeListener("line", onLine);
        resolve(lines.join("\n").trim());
      } else {
        lines.push(line);
      }
    });
  });
}

function hr() {
  console.log("\n" + "─".repeat(60) + "\n");
}

function header(text: string) {
  console.log(`\n  ${text}`);
  console.log("  " + "─".repeat(text.length));
}

async function main() {
  console.log("\n  scaffold-thinking");
  console.log("  Frame → Clarify → Diverge → Decide\n");

  const provider = makeProvider();

  header("Stage 1 of 4 — Frame");
  console.log("  Fill in the five fields. Be specific — vague input produces vague options.\n");

  const problemStatement = await askMultiline("Problem statement");
  const definitionOfDone = await askMultiline("Definition of done");
  const constraints = await askMultiline("Known constraints");
  const engineeringCapacity = await ask("\nEngineering capacity (e.g. 2 engineers, 3 weeks): ");
  const nonNegotiables = await askMultiline("Non-negotiables");

  console.log("\n  (Optional — leave blank for greenfield or unknown systems)");
  const techStack = await askMultiline("Existing tech stack");
  const currentArchitecture = await askMultiline("Current architecture / where this feature lands");

  const input: ProblemInput = {
    id: `cli-${Date.now()}`,
    projectId: `cli-project-${Date.now()}`,
    problemStatement,
    definitionOfDone,
    constraints,
    engineeringCapacity,
    nonNegotiables,
    techStack: techStack || null,
    currentArchitecture: currentArchitecture || null,
    createdAt: new Date(),
  };

  hr();
  header("Stage 2 of 4 — Clarify");
  console.log("  Generating clarifying questions...\n");

  const questions = await clarify(input, provider);

  console.log("  Answer each question. Press Enter to skip.\n");
  const clarifications: Clarification[] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`  Q${i + 1}: ${q.question}`);
    console.log(`  Why it matters: ${q.rationale}\n`);
    const answer = await ask(`  Your answer (or Enter to skip): `);
    clarifications.push({
      id: `q-${i}`,
      projectId: input.projectId,
      question: q.question,
      answer: answer || null,
      order: i,
      createdAt: new Date(),
    });
    console.log();
  }

  hr();
  header("Stage 3 of 4 — Diverge");
  console.log("  Generating solution options...\n");

  const solutions = await diverge(input, clarifications, provider);

  console.log(`  Generated ${solutions.length} option${solutions.length !== 1 ? "s" : ""}:\n`);
  solutions.forEach((s, i) => {
    const badge = s.recommended ? " ★ recommended" : "";
    console.log(`  ${i + 1}. ${s.title}${badge}`);
    console.log(`     ${s.coreApproach.slice(0, 120)}${s.coreApproach.length > 120 ? "..." : ""}`);
    console.log(`     Risk: ${s.complexitySignals.migrationRisk} | Systems: ${s.complexitySignals.systemsTouched.join(", ")}`);
    console.log();
  });

  hr();
  header("Stage 4 of 4 — Decide");

  const pickStr = await ask(`  Pick an option (1–${solutions.length}): `);
  const pick = parseInt(pickStr, 10);
  if (isNaN(pick) || pick < 1 || pick > solutions.length) {
    console.error(`  Invalid choice. Enter a number between 1 and ${solutions.length}.`);
    rl.close();
    process.exit(1);
  }

  const selectedSolution: SolutionOption = solutions[pick - 1];
  const rationale = await askMultiline("\n  Why did you pick this option? (your rationale for the brief)");

  console.log("\n  Generating decision brief...\n");

  const projectTitle = await ask("  Project / decision title: ");

  const brief = await decide(
    {
      projectTitle: projectTitle || "Engineering Decision",
      input,
      clarifications,
      allSolutions: solutions,
      selectedSolution,
      rationale,
    },
    provider
  );

  hr();
  console.log(brief);
  hr();

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
