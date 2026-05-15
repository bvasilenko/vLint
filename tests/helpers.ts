// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { parseSource } from "../src/parse.ts";
import { walkAst } from "../src/walk.ts";
import type { Rule, Diagnostic, RuleContext, LintConfig } from "../src/types.ts";
import { resolveConfig } from "../src/config.ts";

export function runRule(
  rule: Rule,
  source: string,
  configOverride: Partial<LintConfig> = {},
): Diagnostic[] {
  const config = resolveConfig(configOverride);
  const context: RuleContext = {
    file: "test.tsx",
    source,
    tokenScale: new Set(config.tokenScale),
    tokenProps: new Set(config.tokenProps),
  };
  const ast = parseSource(source, "test.tsx");
  return walkAst(ast, [rule], context);
}

export function expectRuleFinds(
  rule: Rule,
  source: string,
  count: number,
  config: Partial<LintConfig> = {},
): Diagnostic[] {
  const diagnostics = runRule(rule, source, config);
  if (diagnostics.length !== count) {
    throw new Error(
      `Expected ${count} diagnostic(s) but got ${diagnostics.length}:\n${JSON.stringify(diagnostics, null, 2)}`,
    );
  }
  return diagnostics;
}

export function expectRuleClean(
  rule: Rule,
  source: string,
  config: Partial<LintConfig> = {},
): void {
  expectRuleFinds(rule, source, 0, config);
}
