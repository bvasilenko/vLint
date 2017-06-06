
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parseSource } from "./parse.ts";
import { walkAst } from "./walk.ts";
import { rules as allRules } from "./rules/index.ts";
import { resolveConfig, effectiveSeverity } from "./config.ts";
import type { LintResult, LintConfig, Rule, RuleContext } from "./types.ts";

type LintOptions = Partial<LintConfig>;

function globToRegex(pattern: string): RegExp {
  const normalized = pattern.replace(/\\/g, "/");
  let result = "";
  let i = 0;
  while (i < normalized.length) {
    if (normalized.startsWith("**/", i)) {
      result += "(?:[^/]+/)*";
      i += 3;
    } else if (normalized.startsWith("**", i)) {
      result += ".*";
      i += 2;
    } else if (normalized[i] === "*") {
      result += "[^/]+";
      i += 1;
    } else if (normalized[i] === "?") {
      result += "[^/]";
      i += 1;
    } else {
      result += normalized[i]!.replace(/[.+^${}()|[\]\\]/g, "\\$&");
      i += 1;
    }
  }
  return new RegExp(`^${result}$`);
}

function expandBraces(pattern: string): string[] {
  const match = pattern.match(/^(.*)\{([^}]+)\}(.*)$/);
  if (!match) return [pattern];
  const [, pre, inner, post] = match;
  return (inner ?? "").split(",").flatMap(opt => expandBraces(`${pre}${opt.trim()}${post}`));
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries.sort()) {
    const full = join(dir, entry);
    try {
      if (statSync(full).isDirectory()) {
        results.push(...collectFiles(full));
      } else {
        results.push(full);
      }
    } catch {
      // skip unreadable entries
    }
  }
  return results;
}

function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return patterns.some(p => globToRegex(p).test(normalized));
}

function expandGlob(pattern: string, cwd: string): string[] {
  const patterns = expandBraces(pattern);
  const results: string[] = [];

  for (const p of patterns) {
    const normalized = p.replace(/\\/g, "/");
    const isAbsolute = normalized.startsWith("/");

    const segments = normalized.split("/");
    const firstWild = segments.findIndex(seg => seg.includes("*") || seg.includes("?"));
    const baseSegments = firstWild === -1 ? segments : segments.slice(0, firstWild);

    const baseDir = isAbsolute
      ? baseSegments.join("/") || "/"
      : join(cwd, baseSegments.join("/") || ".");

    const allFiles = collectFiles(baseDir);

    if (isAbsolute && firstWild === -1) {
      try {
        if (statSync(normalized).isFile()) results.push(normalized);
      } catch {
        // path does not exist — no match
      }
    } else if (isAbsolute) {
      const regex = globToRegex(normalized);
      for (const file of allFiles) {
        const fileNorm = file.replace(/\\/g, "/");
        if (regex.test(fileNorm)) results.push(fileNorm);
      }
    } else {
      const regex = globToRegex(normalized);
      for (const file of allFiles) {
        const rel = relative(cwd, file).replace(/\\/g, "/");
        if (regex.test(rel)) results.push(rel);
      }
    }
  }

  return [...new Set(results)].sort();
}

function buildEnabledRules(config: LintConfig): Rule[] {
  return Object.values(allRules).flatMap(rule => {
    const sev = effectiveSeverity(rule.id, rule.severity, config.rules);
    if (sev === "off") return [];
    if (sev === rule.severity) return [rule];
    return [{
      ...rule,
      severity: sev,
      check(node, context) {
        return rule.check(node, context).map(d => ({ ...d, severity: sev }));
      },
    }];
  });
}

function buildContext(file: string, source: string, config: LintConfig): RuleContext {
  return {
    file,
    source,
    tokenScale: new Set(config.tokenScale),
    tokenProps: new Set(config.tokenProps),
  };
}

export function lint(file: string, opts: LintOptions = {}): LintResult {
  const config = resolveConfig(opts);
  const enabledRules = buildEnabledRules(config);

  let source: string;
  try {
    source = readFileSync(file, "utf-8");
  } catch (err) {
    throw new Error(`vlint: cannot read file "${file}": ${(err as Error).message}`);
  }

  let ast;
  try {
    ast = parseSource(source, file);
  } catch (err) {
    throw new Error(`vlint: parse error in "${file}": ${(err as Error).message}`);
  }

  const context = buildContext(file, source, config);
  const diagnostics = walkAst(ast, enabledRules, context);

  return { file, diagnostics };
}

export async function lintGlob(pattern: string, opts: LintOptions = {}): Promise<LintResult[]> {
  const config = resolveConfig(opts);
  const cwd = process.cwd();

  const files = expandGlob(pattern, cwd).filter(
    f => !matchesAnyPattern(f, config.ignore),
  );

  return Promise.all(
    files.map(f => {
      const abs = f.startsWith("/") ? f : join(cwd, f);
      return Promise.resolve(lint(abs, opts));
    }),
  );
}