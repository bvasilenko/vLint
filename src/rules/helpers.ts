// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import type {
  JSXOpeningElement,
  JSXAttribute,
  StringLiteral,
} from "@babel/types";
import type { Diagnostic, RuleContext, Severity } from "../types.ts";

export function tagName(node: JSXOpeningElement): string | null {
  const { name } = node;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") {
    return `${tagName({ name: name.object } as JSXOpeningElement)}.${name.property.name}`;
  }
  return null;
}

export function isHtmlTag(name: string | null): boolean {
  if (name === null) return false;
  return name[0] === name[0]?.toLowerCase() && name[0] !== name[0]?.toUpperCase();
}

export function isComponentTag(name: string | null): boolean {
  if (name === null) return false;
  return name[0] === name[0]?.toUpperCase();
}

export function getAttribute(
  node: JSXOpeningElement,
  attrName: string,
): JSXAttribute | null {
  for (const attr of node.attributes) {
    if (attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === attrName) {
      return attr;
    }
  }
  return null;
}

export function hasAttribute(node: JSXOpeningElement, attrName: string): boolean {
  return getAttribute(node, attrName) !== null;
}

export function stringAttrValue(
  node: JSXOpeningElement,
  attrName: string,
): string | null {
  const attr = getAttribute(node, attrName);
  if (!attr) return null;

  if (attr.value?.type === "StringLiteral") {
    return (attr.value as StringLiteral).value;
  }

  if (
    attr.value?.type === "JSXExpressionContainer" &&
    attr.value.expression.type === "StringLiteral"
  ) {
    return (attr.value.expression as StringLiteral).value;
  }

  return null;
}

export function lineColumn(
  source: string,
  offset: number,
): { line: number; column: number } {
  const before = source.slice(0, Math.max(0, offset));
  const lines = before.split("\n");
  return { line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 };
}

export function makeDiagnostic(
  context: RuleContext,
  node: JSXOpeningElement,
  ruleId: string,
  severity: Severity,
  message: string,
): Diagnostic {
  const pos = node.start ?? 0;
  const { line, column } = lineColumn(context.source, pos);
  return { file: context.file, line, column, ruleId, message, severity };
}