// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import type { JSXOpeningElement, JSXAttribute } from "@babel/types";
import type { Rule, Diagnostic, RuleContext } from "../types.ts";
import { tagName, makeDiagnostic } from "./helpers.ts";

function numericAttrValueFromAttr(attr: JSXAttribute): number | null {
  if (
    attr.value?.type === "JSXExpressionContainer" &&
    attr.value.expression.type === "NumericLiteral"
  ) {
    return attr.value.expression.value;
  }
  if (attr.value?.type === "StringLiteral") {
    const n = Number(attr.value.value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function tokenAttrNames(node: JSXOpeningElement, tokenProps: ReadonlySet<string>): JSXAttribute[] {
  return node.attributes.filter(
    (a): a is JSXAttribute =>
      a.type === "JSXAttribute" &&
      a.name.type === "JSXIdentifier" &&
      tokenProps.has(a.name.name),
  );
}

export const validTokenValues: Rule = {
  id: "valid-token-values",
  severity: "warn",

  check(node: JSXOpeningElement, context: RuleContext): Diagnostic[] {
    if (context.tokenScale.size === 0) return [];

    const tokenAttrs = tokenAttrNames(node, context.tokenProps);
    if (tokenAttrs.length === 0) return [];

    const name = tagName(node) ?? "element";
    const diagnostics: Diagnostic[] = [];

    for (const attr of tokenAttrs) {
      const propName = (attr.name as import("@babel/types").JSXIdentifier).name;
      const value = numericAttrValueFromAttr(attr);

      if (value === null) continue;
      if (context.tokenScale.has(value)) continue;

      diagnostics.push(
        makeDiagnostic(
          context,
          node,
          validTokenValues.id,
          validTokenValues.severity,
          `<${name}> prop "${propName}={${value}}" is not in the declared token scale`,
        ),
      );
    }

    return diagnostics;
  },
};