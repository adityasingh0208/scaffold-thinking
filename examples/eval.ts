/**
 * Scaffold Thinking — Solution Divergence Eval
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx examples/eval.ts
 *   OPENAI_API_KEY=sk-...       npx tsx examples/eval.ts --provider openai
 */
import { clarify, diverge, AnthropicProvider, OpenAIProvider } from "../src/index";
import type { ModelProvider } from "../src/providers/types";
import type { ProblemInput, Clarification } from "../src/types";
import type { SolutionOption } from "../src/prompts/solution-generation";

function makeProvider(): ModelProvider {
  const useOpenAI = process.argv.includes("--provider") &&
    process.argv[process.argv.indexOf("--provider") + 1] === "openai";
  if (useOpenAI) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) { console.error("OPENAI_API_KEY required"); process.exit(1); }
    return new OpenAIProvider(key);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { console.error("ANTHROPIC_API_KEY required (or use --provider openai)"); process.exit(1); }
  return new AnthropicProvider(key);
}

const SAMPLE_PROBLEMS: Array<Omit<ProblemInput, "id" | "projectId" | "createdAt">> = [
  {
    problemStatement: "Our monolithic Rails app takes 18+ minutes to run the full test suite. This is blocking engineers from getting timely CI feedback and slowing down our release cadence from daily deploys to 2-3 per week.",
    definitionOfDone: "Test suite feedback available within 8 minutes for any PR. Merge queue unblocked. Daily deploy cadence restored.",
    constraints: "Rails 6.1 with RSpec. CI runs on GitHub Actions with standard 2-core runners. We have ~4,000 test examples across 350 spec files. No budget for premium CI runners right now. The test suite is not well-parallelized today.",
    engineeringCapacity: "1 senior engineer, 50% time for 3 weeks. No dedicated DevOps resource.",
    nonNegotiables: "Must not remove test coverage. Cannot change the CI provider (GitHub Actions). All PRs must pass the full test suite before merge.",
    techStack: "Rails 6.1 monolith, RSpec (~4,000 examples / 350 spec files), CI on GitHub Actions standard 2-core runners.",
    currentArchitecture: "Single Rails monolith. CI runs the full RSpec suite on every PR before merge; the suite is not parallelized today and there is no dedicated DevOps tooling.",
  },
  {
    problemStatement: "We have 12 microservices that each implement their own user authentication check, leading to inconsistent behavior, duplicated logic, and a recent security incident where one service had a stale version of the auth library with a known CVE.",
    definitionOfDone: "Single auth path for all services. Security team can audit and patch auth in one place. New services can onboard auth in under 1 day.",
    constraints: "Services are in Python, Go, and Node.js. We run on Kubernetes. We use JWTs with RS256 signed by our own identity service. We cannot break any existing service integrations or client tokens during migration.",
    engineeringCapacity: "Platform team: 3 engineers, full-time for 2 months. Each service team can provide 2-4 hours of review/integration support.",
    nonNegotiables: "Zero downtime. Existing client tokens must remain valid throughout the migration. The identity service (issuer) is not being replaced.",
    techStack: "Services in Python, Go, and Node.js on Kubernetes. JWTs signed RS256 by an in-house identity service.",
    currentArchitecture: "12 microservices, each implementing its own auth check against the shared identity service. No central auth library or gateway today.",
  },
  {
    problemStatement: "Our startup's product database uses a single Postgres instance. We're growing quickly and some tables (events, audit_logs, user_activity) have grown to 100M+ rows. Read queries on these tables are now timing out, causing user-facing errors during peak hours.",
    definitionOfDone: "P99 read latency on affected tables under 200ms at current load. System handles 3x current peak without degradation.",
    constraints: "Postgres 14 on AWS RDS db.r6g.xlarge. No separate read replica today. App is a Next.js monolith with Prisma ORM. Total engineering team is 4 people. Cannot afford major refactors to application query patterns.",
    engineeringCapacity: "2 engineers, roughly 3 weeks of focused time available.",
    nonNegotiables: "No data loss. Must stay on AWS. Cannot break the existing Prisma schema interface.",
    techStack: "Postgres 14 on AWS RDS (db.r6g.xlarge), Next.js monolith with Prisma ORM.",
    currentArchitecture: "Single primary Postgres instance with no read replica. The app reads and writes directly through Prisma; append-heavy tables have grown past 100M rows.",
  },
];

const SAMPLE_STACK_KEYWORDS: string[][] = [
  ["rails", "rspec", "github actions", "ci"],
  ["kubernetes", "jwt", "identity service", "python", "go", "node"],
  ["postgres", "prisma", "rds", "next.js", "read replica"],
];

const ARCHITECTURAL_PATTERNS = ["event-driven","event sourcing","cqrs","microservice","monolith","service mesh","sidecar","proxy","gateway","cache","async","synchronous","polling","streaming","batch","read replica","sharding","partitioning","materialized view","denormalization"];
const BUILD_VS_BUY_SIGNALS = ["managed service","saas","vendor","third-party","off-the-shelf","custom","build","implement","write our own","open source","self-hosted","hosted"];
const SCOPE_SIGNALS = ["full replacement","incremental","phased","strangler fig","big bang","surgical","targeted","minimal","comprehensive","complete rewrite","parallel","gradual"];
const SEQUENCING_SIGNALS = ["feature flag","canary","blue-green","dual-write","shadow","cutover","rollout","migration","transition"];

function extractSignals(s: SolutionOption): Set<string> {
  const text = [s.title, s.coreApproach, s.bestFitWhen, ...s.tradeoffs].join(" ").toLowerCase();
  const signals = new Set<string>();
  for (const p of ARCHITECTURAL_PATTERNS) if (text.includes(p)) signals.add(`arch:${p}`);
  for (const p of BUILD_VS_BUY_SIGNALS) if (text.includes(p)) signals.add(`bvb:${p}`);
  for (const p of SCOPE_SIGNALS) if (text.includes(p)) signals.add(`scope:${p}`);
  for (const p of SEQUENCING_SIGNALS) if (text.includes(p)) signals.add(`seq:${p}`);
  signals.add(`risk:${s.complexitySignals.migrationRisk}`);
  for (const sys of s.complexitySignals.systemsTouched)
    signals.add(`sys:${sys.toLowerCase().replace(/\s+/g, "-")}`);
  return signals;
}

function divergenceScore(solutions: SolutionOption[]): number {
  const sets = solutions.map((s) => extractSignals(s));
  const uniqueToEach = sets.map((set, i) =>
    [...set].filter((sig) => sets.filter((_, j) => j !== i).every((other) => !other.has(sig)))
  );
  return uniqueToEach.reduce((sum, u) => sum + u.length, 0) / solutions.length;
}

async function runEval() {
  const provider = makeProvider();
  console.log("=".repeat(60));
  console.log("SCAFFOLD THINKING — DIVERGENCE EVAL");
  console.log("=".repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  for (let i = 0; i < SAMPLE_PROBLEMS.length; i++) {
    const problem = SAMPLE_PROBLEMS[i];
    console.log(`\nPROBLEM ${i + 1}/${SAMPLE_PROBLEMS.length}`);
    console.log(`"${problem.problemStatement.slice(0, 80)}..."`);

    const input: ProblemInput = { id: `eval-${i}`, projectId: `eval-project-${i}`, createdAt: new Date(), ...problem };

    process.stdout.write("  [1/2] Clarifying... ");
    let clarifications: Clarification[] = [];
    try {
      const questions = await clarify(input, provider);
      clarifications = questions.map((q, idx) => ({ id: `c-${idx}`, projectId: input.projectId, question: q.question, answer: "Assume a typical mid-size tech startup with standard practices.", order: idx, createdAt: new Date() }));
      console.log(`${questions.length} questions`);
    } catch (err) { console.log("FAILED"); console.error(err); }

    process.stdout.write("  [2/2] Diverging... ");
    let solutions: SolutionOption[] = [];
    try {
      solutions = await diverge(input, clarifications, provider);
      console.log(`${solutions.length} options: ${solutions.map((s) => `"${s.title}"`).join(", ")}`);
    } catch (err) { console.log("FAILED"); console.error(err); }

    const assertions: Array<{ name: string; passed: boolean; detail: string }> = [];
    assertions.push({ name: "Has 1-4 viable options", passed: solutions.length >= 1 && solutions.length <= 4, detail: `Generated ${solutions.length}` });
    const recommendedCount = solutions.filter((s) => s.recommended).length;
    assertions.push({ name: "At most one option recommended", passed: recommendedCount <= 1, detail: `${recommendedCount} flagged recommended` });

    if (solutions.length >= 2) {
      const titles = solutions.map((s) => s.title.toLowerCase());
      assertions.push({ name: "All titles distinct", passed: new Set(titles).size === titles.length, detail: titles.join(", ") });
      const risks = new Set(solutions.map((s) => s.complexitySignals.migrationRisk));
      assertions.push({ name: "Migration risk varies (>=2 distinct values)", passed: risks.size >= 2, detail: [...risks].join(", ") });
      const score = divergenceScore(solutions);
      assertions.push({ name: "Divergence score >= 3.0", passed: score >= 3.0, detail: `Score: ${score.toFixed(2)}` });
      assertions.push({ name: "All options have >= 3 tradeoffs", passed: solutions.every((s) => s.tradeoffs.length >= 3), detail: solutions.map((s) => `${s.title}: ${s.tradeoffs.length}`).join(", ") });
      const stackKeywords = SAMPLE_STACK_KEYWORDS[i] ?? [];
      const groundedCount = solutions.filter((s) => { const text = [s.title, s.coreApproach, s.bestFitWhen, ...s.tradeoffs, ...s.complexitySignals.systemsTouched].join(" ").toLowerCase(); return stackKeywords.some((k) => text.includes(k)); }).length;
      assertions.push({ name: "Options grounded in existing stack", passed: groundedCount >= Math.ceil(solutions.length / 2), detail: `${groundedCount}/${solutions.length} reference stack keywords` });
    }

    for (const a of assertions) {
      console.log(`  ${a.passed ? "✓" : "✗"} ${a.name}`);
      console.log(`    ${a.detail}`);
    }
    totalPassed += assertions.filter((a) => a.passed).length;
    totalFailed += assertions.filter((a) => !a.passed).length;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`${totalPassed}/${totalPassed + totalFailed} assertions passed`);
  console.log("=".repeat(60));
  process.exit(totalFailed > 0 ? 1 : 0);
}

runEval().catch((err) => { console.error(err); process.exit(1); });
