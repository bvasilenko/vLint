// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import type { JSXOpeningElement } from "@babel/types";
import type { Rule, Diagnostic, RuleContext } from "../types.ts";
import { tagName, hasAttribute, makeDiagnostic } from "./helpers.ts";

export const noRawStyle: Rule = {
  id: "no-raw-style",
  severity: "error",

  check(node: JSXOpeningElement, context: RuleContext): Diagnostic[] {
    if (!hasAttribute(node, "style")) return [];
    const name = tagName(node) ?? "element";

    return [
      makeDiagnostic(
        context,
        node,
        noRawStyle.id,
        noRawStyle.severity,
        `<${name}> uses raw style prop — use vDsl token props instead`,
      ),
    ];
  },
};