import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..", "..", "..");
const SRC_ROOT = join(REPO_ROOT, "src");

/**
 * The unauthenticated /api/coach (streaming OpenAI) and /api/coach/messages
 * routes belonged to the parked, unreachable /ai-coach prototype — not the
 * current Coach workspace (src/app/api/coach/conversations/**). They were
 * live, callable, and had zero authentication. Audited and confirmed
 * unused by anything current before removal — see
 * docs/COACH_CONVERSATION_WORKSPACE.md and the security-closure PR. This
 * guards against either reappearing.
 */
describe("legacy /ai-coach chain — removed, not just unlinked", () => {
  it("the old unauthenticated route files no longer exist", () => {
    expect(existsSync(join(SRC_ROOT, "app/api/coach/route.ts"))).toBe(false);
    expect(existsSync(join(SRC_ROOT, "app/api/coach/messages/route.ts"))).toBe(false);
  });

  it("the dead hook and component that only that chain used no longer exist", () => {
    expect(existsSync(join(SRC_ROOT, "hooks/useCoach.ts"))).toBe(false);
    expect(existsSync(join(SRC_ROOT, "components/ai-coach/AICoach.tsx"))).toBe(false);
  });

  it("no source file fetches the old unauthenticated '/api/coach' endpoint", () => {
    const offenders = findMatches(SRC_ROOT, /fetch\(\s*['"]\/api\/coach['"]/);
    expect(offenders).toEqual([]);
  });

  it("no source file fetches the old '/api/coach/messages' endpoint", () => {
    const offenders = findMatches(SRC_ROOT, /['"]\/api\/coach\/messages['"]/);
    expect(offenders).toEqual([]);
  });

  it("the current Coach workspace only calls the secured conversations API surface", () => {
    const serviceFile = readFileSync(join(SRC_ROOT, "services/coach/index.ts"), "utf8");
    const apiPaths = [...serviceFile.matchAll(/["'`](\/api\/coach\/[^"'`]*)["'`]/g)].map((m) => m[1]);

    expect(apiPaths.length).toBeGreaterThan(0);
    for (const path of apiPaths) {
      expect(path.startsWith("/api/coach/conversations")).toBe(true);
    }
  });

  it("the current Coach page (/ai-coach still exists as a separate, unrelated 'Coming Later' placeholder) does not render the removed AICoach component", () => {
    const aiCoachPage = readFileSync(join(SRC_ROOT, "app/(app)/ai-coach/page.tsx"), "utf8");
    expect(aiCoachPage).not.toMatch(/components\/ai-coach\/AICoach/);
    expect(aiCoachPage).not.toMatch(/<AICoach\b/);
    expect(aiCoachPage).not.toMatch(/useCoach\(/);
  });
});

function findMatches(dir: string, pattern: RegExp, results: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findMatches(fullPath, pattern, results);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (fullPath === __filename) continue;
    const content = readFileSync(fullPath, "utf8");
    if (pattern.test(content)) results.push(fullPath);
  }
  return results;
}
