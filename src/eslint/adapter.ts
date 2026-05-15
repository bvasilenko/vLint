// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import type { Rule as VLintRule, Diagnostic, RuleContext } from "../types.ts";
import { resolveConfig } from "../config.ts";
import { toJsxOpeningElement } from "./estree-bridge.ts";

export interface EslintRuleContext {
  getFilename(): string;
  getSourceCode(): { getText(): string };
  report(opts: { node: unknown; message: string }): void;
  options: unknown[];
}

export interface EslintRule {
  meta: {
    type: "problem" | "suggestion" | "layout";
    docs: { description: string; recommended: boolean };
    schema: unknown[];
    messages: Record<string, string>;
  };
  create(context: EslintRuleContext): Record<string, (node: unknown) => void>;
}

export function adaptRule(vlintRule: VLintRule): EslintRule {
  return {
    meta: {
      type: "problem",
      docs: { description: vlintRule.id, recommended: true },
      schema: [],
      messages: { [vlintRule.id]: "{{ message }}" },
    },

    create(context: EslintRuleContext) {
      const config = resolveConfig();
      const ruleContext: RuleContext = {
        file: context.getFilename(),
        source: context.getSourceCode().getText(),
        tokenScale: new Set(config.tokenScale),
        tokenProps: new Set(config.tokenProps),
      };

      return {
        JSXOpeningElement(eslintNode: unknown) {
          const babelNode = toJsxOpeningElement(eslintNode);
          if (!babelNode) return;

          const diagnostics: Diagnostic[] = vlintRule.check(babelNode, ruleContext);
          for (const d of diagnostics) {
            context.report({ node: eslintNode, message: d.message });
          }
        },
      };
    },
  };
}
