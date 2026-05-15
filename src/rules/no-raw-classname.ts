// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import type { JSXOpeningElement } from "@babel/types";
import type { Rule, Diagnostic, RuleContext } from "../types.ts";
import { tagName, isHtmlTag, hasAttribute, makeDiagnostic } from "./helpers.ts";

export const noRawClassname: Rule = {
  id: "no-raw-classname",
  severity: "error",

  check(node: JSXOpeningElement, context: RuleContext): Diagnostic[] {
    const name = tagName(node);
    if (!isHtmlTag(name)) return [];
    if (!hasAttribute(node, "className")) return [];

    return [
      makeDiagnostic(
        context,
        node,
        noRawClassname.id,
        noRawClassname.severity,
        `<${name}> uses className — replace with a vDsl component`,
      ),
    ];
  },
};