// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import type { JSXOpeningElement } from "@babel/types";
import type { Rule, Diagnostic, RuleContext } from "../types.ts";
import { tagName, getAttribute, makeDiagnostic } from "./helpers.ts";

const ARBITRARY_VALUE_PATTERN = /\[.+?\]/;

function extractClassString(node: JSXOpeningElement): string | null {
  const attr = getAttribute(node, "className");
  if (!attr) return null;

  if (attr.value?.type === "StringLiteral") return attr.value.value;

  if (
    attr.value?.type === "JSXExpressionContainer" &&
    attr.value.expression.type === "StringLiteral"
  ) {
    return attr.value.expression.value;
  }

  return null;
}

function arbitraryTokens(classes: string): string[] {
  return classes.split(/\s+/).filter(cls => ARBITRARY_VALUE_PATTERN.test(cls));
}

export const noArbitraryClass: Rule = {
  id: "no-arbitrary-class",
  severity: "error",

  check(node: JSXOpeningElement, context: RuleContext): Diagnostic[] {
    const classString = extractClassString(node);
    if (classString === null) return [];

    const bad = arbitraryTokens(classString);
    if (bad.length === 0) return [];

    const name = tagName(node) ?? "element";
    return [
      makeDiagnostic(
        context,
        node,
        noArbitraryClass.id,
        noArbitraryClass.severity,
        `<${name}> className contains arbitrary value(s): ${bad.join(", ")}`,
      ),
    ];
  },
};