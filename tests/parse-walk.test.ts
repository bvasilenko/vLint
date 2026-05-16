// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import type { JSXOpeningElement } from "@babel/types";
import type { Rule, RuleContext, Diagnostic } from "../src/types.ts";
import { parseSource } from "../src/parse.ts";
import { walkAst } from "../src/walk.ts";

const EMPTY_CONTEXT: RuleContext = {
  file: "test.tsx",
  source: "",
  tokenScale: new Set(),
  tokenProps: new Set(),
};

function alwaysErrorRule(ruleId: string): Rule {
  return {
    id: ruleId,
    severity: "error",
    check(_node, context): Diagnostic[] {
      return [{ file: context.file, line: 1, column: 1, ruleId, message: "test", severity: "error" }];
    },
  };
}

function countingRule(id = "counter"): Rule & { callCount: number } {
  const rule: Rule & { callCount: number } = {
    id,
    severity: "error",
    callCount: 0,
    check() {
      rule.callCount += 1;
      return [];
    },
  };
  return rule;
}

describe("parseSource", () => {
  it("returns a Babel File node for a minimal JSX element", () => {
    const ast = parseSource("<div />", "test.tsx");
    expect(ast.type).toBe("File");
  });

  it("parses TypeScript generic syntax without throwing", () => {
    expect(() => parseSource("const x = useRef<HTMLDivElement>(null);", "test.ts")).not.toThrow();
  });

  it("parses optional chaining and nullish coalescing without throwing", () => {
    expect(() => parseSource("const v = a?.b ?? 'default';", "test.ts")).not.toThrow();
  });

  it("parses class properties and private fields without throwing", () => {
    expect(() =>
      parseSource("class C { #x = 1; static y = 2; }", "test.ts"),
    ).not.toThrow();
  });

  it("parses JSX alongside TypeScript type annotations in the same file", () => {
    const src = `
      type Props = { label: string };
      function Cmp({ label }: Props) { return <div>{label}</div>; }
    `;
    expect(() => parseSource(src, "test.tsx")).not.toThrow();
  });

  it("throws on irrecoverable syntax errors", () => {
    expect(() => parseSource("<<< not valid js >>>", "test.tsx")).toThrow();
  });

  it("returns a File node for an empty source string", () => {
    const ast = parseSource("", "test.tsx");
    expect(ast.type).toBe("File");
  });
});

describe("walkAst", () => {
  it("returns an empty array when the rules list is empty", () => {
    const ast = parseSource("<div className='p-4' />", "test.tsx");
    expect(walkAst(ast, [], EMPTY_CONTEXT)).toEqual([]);
  });

  it("returns an empty array and never calls check when there are no JSX elements", () => {
    const ast = parseSource("const x = 1 + 2;", "test.tsx");
    const rule = countingRule();
    expect(walkAst(ast, [rule], EMPTY_CONTEXT)).toEqual([]);
    expect(rule.callCount).toBe(0);
  });

  it("calls check once per JSXOpeningElement in the source", () => {
    const ast = parseSource("<><div /><span /></>", "test.tsx");
    const rule = countingRule();
    walkAst(ast, [rule], EMPTY_CONTEXT);
    expect(rule.callCount).toBe(2);
  });

  it("calls every rule's check on every JSXOpeningElement", () => {
    const ast = parseSource("<><div /><span /></>", "test.tsx");
    const r1 = countingRule();
    const r2 = countingRule("counter2");
    walkAst(ast, [r1, r2], EMPTY_CONTEXT);
    expect(r1.callCount).toBe(2);
    expect(r2.callCount).toBe(2);
  });

  it("accumulates diagnostics from multiple rules into a single flat array", () => {
    const ast = parseSource("<div />", "test.tsx");
    const result = walkAst(ast, [alwaysErrorRule("r1"), alwaysErrorRule("r2")], EMPTY_CONTEXT);
    expect(result).toHaveLength(2);
    expect(result.map(d => d.ruleId).sort()).toEqual(["r1", "r2"]);
  });

  it("accumulates diagnostics from multiple JSX nodes via a single rule", () => {
    const ast = parseSource("<><div /><span /><p /></>", "test.tsx");
    const result = walkAst(ast, [alwaysErrorRule("r")], EMPTY_CONTEXT);
    expect(result).toHaveLength(3);
  });

  it("passes the same context reference to every rule invocation", () => {
    const captured: RuleContext[] = [];
    const capturingRule: Rule = {
      id: "capture",
      severity: "error",
      check(_node, context) {
        captured.push(context);
        return [];
      },
    };
    const ast = parseSource("<><div /><span /></>", "test.tsx");
    walkAst(ast, [capturingRule], EMPTY_CONTEXT);
    expect(captured.length).toBe(2);
    expect(captured[0]).toBe(EMPTY_CONTEXT);
    expect(captured[1]).toBe(EMPTY_CONTEXT);
  });

  it("does not visit JSXOpeningFragment — only JSXOpeningElement nodes are checked", () => {
    const ast = parseSource("<><div /></>", "test.tsx");
    const rule = countingRule();
    walkAst(ast, [rule], EMPTY_CONTEXT);
    expect(rule.callCount).toBe(1);
  });

  it("returns an empty array for a source with JSX fragments but no element children", () => {
    const ast = parseSource("<>hello world</>", "test.tsx");
    expect(walkAst(ast, [alwaysErrorRule("r")], EMPTY_CONTEXT)).toEqual([]);
  });
});
