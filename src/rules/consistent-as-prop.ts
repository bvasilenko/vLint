// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import type { JSXOpeningElement } from "@babel/types";
import type { Rule, Diagnostic, RuleContext } from "../types.ts";
import { tagName, isComponentTag, stringAttrValue, makeDiagnostic } from "./helpers.ts";
import { HTML_TAGS } from "./html-tags.ts";

export const consistentAsProp: Rule = {
  id: "consistent-as-prop",
  severity: "warn",

  check(node: JSXOpeningElement, context: RuleContext): Diagnostic[] {
    const name = tagName(node);
    if (!isComponentTag(name)) return [];

    const asValue = stringAttrValue(node, "as");
    if (asValue === null) return [];
    if (!HTML_TAGS.has(asValue)) return [];

    return [
      makeDiagnostic(
        context,
        node,
        consistentAsProp.id,
        consistentAsProp.severity,
        `<${name} as="${asValue}"> renders as a raw HTML element — use the corresponding vDsl component directly`,
      ),
    ];
  },
};