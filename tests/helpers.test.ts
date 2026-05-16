// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import type { JSXOpeningElement } from "@babel/types";
import type { Rule, RuleContext } from "../src/types.ts";
import { parseSource } from "../src/parse.ts";
import { walkAst } from "../src/walk.ts";
import {
  tagName,
  isHtmlTag,
  isComponentTag,
  lineColumn,
  getAttribute,
  hasAttribute,
  stringAttrValue,
} from "../src/rules/helpers.ts";

const CONTEXT: RuleContext = {
  file: "test.tsx",
  source: "",
  tokenScale: new Set(),
  tokenProps: new Set(),
};

function extractOpenings(source: string): JSXOpeningElement[] {
  const ast = parseSource(source, "test.tsx");
  const collected: JSXOpeningElement[] = [];
  const collector: Rule = {
    id: "collector",
    severity: "error",
    check(node) {
      collected.push(node);
      return [];
    },
  };
  walkAst(ast, [collector], CONTEXT);
  return collected;
}

function firstOpening(source: string): JSXOpeningElement {
  const nodes = extractOpenings(source);
  if (!nodes[0]) throw new Error(`No JSXOpeningElement found in: ${source}`);
  return nodes[0];
}

describe("tagName", () => {
  it("returns the identifier name for a plain lowercase element", () => {
    expect(tagName(firstOpening("<div />"))).toBe("div");
  });

  it("returns the identifier name for an uppercase component", () => {
    expect(tagName(firstOpening("<MyComponent />"))).toBe("MyComponent");
  });

  it("returns a dotted path for a two-level member-expression component", () => {
    expect(tagName(firstOpening("<Foo.Bar />"))).toBe("Foo.Bar");
  });

  it("returns a fully dotted path for a three-level member-expression component", () => {
    expect(tagName(firstOpening("<A.B.C />"))).toBe("A.B.C");
  });

  it("returns null for a namespaced element (JSXNamespacedName is unresolvable)", () => {
    expect(tagName(firstOpening("<foo:bar />"))).toBeNull();
  });
});

describe("isHtmlTag", () => {
  it("returns true for a multi-character lowercase tag", () => {
    expect(isHtmlTag("div")).toBe(true);
    expect(isHtmlTag("section")).toBe(true);
  });

  it("returns true for a single lowercase character — anchor tag edge case", () => {
    expect(isHtmlTag("a")).toBe(true);
  });

  it("returns false for an uppercase-initial component name", () => {
    expect(isHtmlTag("Box")).toBe(false);
    expect(isHtmlTag("MyComponent")).toBe(false);
  });

  it("returns false for a single uppercase character", () => {
    expect(isHtmlTag("A")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isHtmlTag(null)).toBe(false);
  });

  it("returns false for a member-expression string with uppercase initial", () => {
    expect(isHtmlTag("Foo.Bar")).toBe(false);
  });
});

describe("isComponentTag", () => {
  it("returns true for an uppercase-initial name", () => {
    expect(isComponentTag("Box")).toBe(true);
    expect(isComponentTag("MyComponent")).toBe(true);
  });

  it("returns true for a dotted member-expression string with uppercase initial", () => {
    expect(isComponentTag("Foo.Bar")).toBe(true);
  });

  it("returns false for a lowercase-initial name", () => {
    expect(isComponentTag("div")).toBe(false);
    expect(isComponentTag("span")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isComponentTag(null)).toBe(false);
  });
});

describe("lineColumn", () => {
  it("returns line 1, column 1 for offset 0 in any source", () => {
    expect(lineColumn("hello", 0)).toEqual({ line: 1, column: 1 });
  });

  it("returns the correct column for an offset mid-line", () => {
    expect(lineColumn("<div />", 5)).toEqual({ line: 1, column: 6 });
  });

  it("advances to line 2 after the first newline", () => {
    const src = "line1\nline2";
    const offsetOfLine2Start = "line1\n".length;
    expect(lineColumn(src, offsetOfLine2Start)).toEqual({ line: 2, column: 1 });
  });

  it("reports the correct column on a subsequent line", () => {
    const src = "ab\ncd";
    expect(lineColumn(src, 3)).toEqual({ line: 2, column: 1 });
    expect(lineColumn(src, 4)).toEqual({ line: 2, column: 2 });
  });

  it("clamps negative offsets to the start of source", () => {
    expect(lineColumn("abc", -1)).toEqual({ line: 1, column: 1 });
  });

  it("handles an empty source at offset 0", () => {
    expect(lineColumn("", 0)).toEqual({ line: 1, column: 1 });
  });
});

describe("getAttribute", () => {
  it("returns the named attribute when present", () => {
    const node = firstOpening(`<div className="p-4" />`);
    expect(getAttribute(node, "className")).not.toBeNull();
  });

  it("returns null when the attribute is absent", () => {
    const node = firstOpening(`<div id="root" />`);
    expect(getAttribute(node, "className")).toBeNull();
  });

  it("returns null when the element has no attributes", () => {
    expect(getAttribute(firstOpening("<div />"), "className")).toBeNull();
  });

  it("skips JSXSpreadAttribute entries and returns null when no named match exists", () => {
    const node = firstOpening(`<div {...props} />`);
    expect(getAttribute(node, "className")).toBeNull();
  });

  it("returns the first matching attribute when multiple attributes are present", () => {
    const node = firstOpening(`<div id="root" className="p-4" />`);
    const attr = getAttribute(node, "className");
    expect(attr).not.toBeNull();
    expect(attr?.name.type).toBe("JSXIdentifier");
  });
});

describe("hasAttribute", () => {
  it("returns true when the named attribute is present", () => {
    expect(hasAttribute(firstOpening(`<div className="p-4" />`), "className")).toBe(true);
  });

  it("returns false when the named attribute is absent", () => {
    expect(hasAttribute(firstOpening("<div />"), "className")).toBe(false);
  });

  it("returns false when only spread attributes are present", () => {
    expect(hasAttribute(firstOpening("<div {...props} />"), "className")).toBe(false);
  });
});

describe("stringAttrValue", () => {
  it("returns the string for a plain string-literal attribute value", () => {
    expect(stringAttrValue(firstOpening(`<div className="p-4" />`), "className")).toBe("p-4");
  });

  it("returns the string for a JSX expression container wrapping a string literal", () => {
    expect(stringAttrValue(firstOpening(`<Box as={"div"} />`), "as")).toBe("div");
  });

  it("returns null for a JSX expression container wrapping a non-string (identifier)", () => {
    expect(stringAttrValue(firstOpening(`<Box p={myVar} />`), "p")).toBeNull();
  });

  it("returns null for a JSX expression container wrapping an object expression", () => {
    expect(stringAttrValue(firstOpening(`<div style={{}} />`), "style")).toBeNull();
  });

  it("returns null when the attribute is absent", () => {
    expect(stringAttrValue(firstOpening("<div />"), "className")).toBeNull();
  });
});
