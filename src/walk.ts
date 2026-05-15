// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import _traverse from "@babel/traverse";
import type { File } from "@babel/types";
import type { Diagnostic, Rule, RuleContext } from "./types.ts";

const traverse =
  typeof _traverse === "function"
    ? _traverse
    : /* v8 ignore next */
      (_traverse as unknown as { default: typeof _traverse }).default;

export function walkAst(
  ast: File,
  enabledRules: Rule[],
  context: RuleContext,
): Diagnostic[] {
  if (enabledRules.length === 0) return [];

  const diagnostics: Diagnostic[] = [];

  traverse(ast, {
    JSXOpeningElement(path) {
      for (const rule of enabledRules) {
        const found = rule.check(path.node, context);
        diagnostics.push(...found);
      }
    },
  });

  return diagnostics;
}