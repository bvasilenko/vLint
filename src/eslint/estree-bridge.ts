
import type { JSXOpeningElement } from "@babel/types";

type EstreeNode = Record<string, unknown>;

function normalizeLiteralNode(node: EstreeNode): EstreeNode {
  if (node["type"] !== "Literal") return node;
  return {
    ...node,
    type: typeof node["value"] === "number" ? "NumericLiteral" : "StringLiteral",
  };
}

function normalizeAttrValue(value: EstreeNode): EstreeNode {
  if (value["type"] === "Literal") return normalizeLiteralNode(value);
  if (value["type"] === "JSXExpressionContainer") {
    const expr = value["expression"];
    if (!expr || typeof expr !== "object") return value;
    return { ...value, expression: normalizeLiteralNode(expr as EstreeNode) };
  }
  return value;
}

function normalizeAttribute(attr: EstreeNode): EstreeNode {
  const value = attr["value"];
  if (!value || typeof value !== "object") return attr;
  return { ...attr, value: normalizeAttrValue(value as EstreeNode) };
}

export function toJsxOpeningElement(estreeNode: unknown): JSXOpeningElement | null {
  const node = estreeNode as EstreeNode;
  if (node?.["type"] !== "JSXOpeningElement") return null;

  const range = node["range"] as [number, number] | undefined;
  const attributes = (node["attributes"] as EstreeNode[]).map(normalizeAttribute);

  return {
    ...node,
    start: range?.[0] ?? 0,
    attributes,
  } as unknown as JSXOpeningElement;
}
