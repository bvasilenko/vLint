// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import { noRawClassname } from "../src/rules/no-raw-classname.ts";
import { runRule, expectRuleFinds, expectRuleClean } from "./helpers.ts";

describe("no-raw-classname", () => {
  describe("flags", () => {
    it("any lowercase HTML element carrying a className attribute", () => {
      expectRuleFinds(noRawClassname, `<div className="p-4">x</div>`, 1);
    });

    it("inline elements (span, p, a, …) with className", () => {
      expectRuleFinds(noRawClassname, `<span className="text-sm">x</span>`, 1);
      expectRuleFinds(noRawClassname, `<p className="leading-6">x</p>`, 1);
    });

    it("self-closing HTML elements with className", () => {
      expectRuleFinds(noRawClassname, `<input className="border" />`, 1);
    });

    it("className supplied as a JSX expression container string", () => {
      expectRuleFinds(noRawClassname, `<div className={"p-4"}>x</div>`, 1);
    });

    it("className supplied as any dynamic expression (cannot statically evaluate)", () => {
      expectRuleFinds(noRawClassname, `<div className={styles.root}>x</div>`, 1);
    });

    it("every matched element in a tree — accumulates all violations", () => {
      const src = `<><div className="a">x</div><span className="b">y</span></>`;
      expectRuleFinds(noRawClassname, src, 2);
    });

    it("nested HTML element with className, even inside a component", () => {
      expectRuleFinds(noRawClassname, `<Box><div className="p-2">x</div></Box>`, 1);
    });

    it("HTML element with className present alongside spread props — className is still detected", () => {
      expectRuleFinds(noRawClassname, `<div {...props} className="p-4">x</div>`, 1);
    });
  });

  describe("ignores", () => {
    it("uppercase (component) elements regardless of className presence", () => {
      expectRuleClean(noRawClassname, `<Box className="p-4">x</Box>`);
    });

    it("HTML elements without any className attribute", () => {
      expectRuleClean(noRawClassname, `<div id="root">x</div>`);
    });

    it("HTML elements with only spread attributes (className cannot be detected)", () => {
      expectRuleClean(noRawClassname, `<div {...props}>x</div>`);
    });

    it("JSX fragments", () => {
      expectRuleClean(noRawClassname, `<>hello</>`);
    });

    it("namespaced JSX tags (not an HTML element by convention)", () => {
      expectRuleClean(noRawClassname, `<foo:bar className="p-4">x</foo:bar>`);
    });

    it("JSX member-expression components with className", () => {
      expectRuleClean(noRawClassname, `<Foo.Bar className="p-4">x</Foo.Bar>`);
    });
  });

  describe("diagnostic properties", () => {
    it("ruleId is no-raw-classname and severity is error", () => {
      const [d] = expectRuleFinds(noRawClassname, `<div className="p-4">x</div>`, 1);
      expect(d!.ruleId).toBe("no-raw-classname");
      expect(d!.severity).toBe("error");
    });

    it("diagnostic includes the tag name in the message", () => {
      const [d] = expectRuleFinds(noRawClassname, `<section className="mt-4">x</section>`, 1);
      expect(d!.message).toContain("<section>");
    });

    it("diagnostic carries the correct file, line, and column", () => {
      const src = `\n<div className="p-4">x</div>`;
      const [d] = runRule(noRawClassname, src);
      expect(d!.file).toBe("test.tsx");
      expect(d!.line).toBe(2);
      expect(d!.column).toBeGreaterThan(0);
    });
  });
});
