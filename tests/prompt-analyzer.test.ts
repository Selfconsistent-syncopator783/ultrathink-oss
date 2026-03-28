import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const ANALYZER = resolve(ROOT, ".claude/hooks/prompt-analyzer.ts");

function analyze(prompt: string): { skills: { name: string; score: number }[]; context: string } {
  const output = execFileSync("npx", ["tsx", ANALYZER, prompt], {
    encoding: "utf-8",
    cwd: ROOT,
    timeout: 15000,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return JSON.parse(output);
}

describe("prompt-analyzer", () => {
  it("returns empty for short prompts", () => {
    const result = analyze("hi");
    expect(result.skills).toHaveLength(0);
    expect(result.context).toBe("");
  });

  it("matches direct trigger keywords", () => {
    const result = analyze("build a react component with hooks");
    const names = result.skills.map((s) => s.name);
    expect(names).toContain("react");
  });

  it("matches multi-word triggers with higher score", () => {
    const result = analyze("debug the failing test suite with breakpoints");
    const debug = result.skills.find((s) => s.name === "debug");
    expect(debug).toBeDefined();
    expect(debug!.score).toBeGreaterThan(2);
  });

  it("does NOT trigger unrelated skills", () => {
    const result = analyze("fix the landing page layout and spacing");
    const names = result.skills.map((s) => s.name);
    expect(names).not.toContain("ship");
    expect(names).not.toContain("scout");
  });

  it("respects MAX_SKILLS limit of 5", () => {
    const result = analyze(
      "deploy nextjs app with prisma database to vercel using docker and kubernetes with terraform"
    );
    expect(result.skills.length).toBeLessThanOrEqual(5);
  });

  it("includes activation in context when skills match", { timeout: 20000 }, () => {
    const result = analyze("refactor the react component to use hooks and fix the bug");
    expect(result.context).toContain("ACTIVATE");
    expect(result.context).toContain("Skill()");
  });

  it("handles valid prompt without crashing", { timeout: 20000 }, () => {
    const result = analyze("a normal software engineering question about patterns");
    expect(result).toHaveProperty("skills");
    expect(result).toHaveProperty("context");
  });
});
