// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import { noArbitraryClass } from "../src/rules/no-arbitrary-class.ts";
import { expectRuleFinds, expectRuleClean } from "./helpers.ts";

describe("no-arbitrary-class", () => {
  describe("flags", () => {
    it("a single arbitrary value class (hex color)", () => {
      expectRuleFinds(noArbitraryClass, `<Box className="bg-[#fff]" />`, 1);
    });

    it("a single arbitrary value class (pixel dimension)", () => {
      expectRuleFinds(noArbitraryClass, `<div className="w-[200px]">x</div>`, 1);
    });

    it("a calc() expression inside an arbitrary value", () => {
      expectRuleFinds(noArbitraryClass, `<Box className="w-[calc(100%-2rem)]" />`, 1);
    });

    it("arbitrary font size value", () => {
      expectRuleFinds(noArbitraryClass, `<p className="text-[14px]">x</p>`, 1);
    });

    it("arbitrary value mixed with regular classes — emits one diagnostic listing all offenders", () => {
      const [d] = expectRuleFinds(noArbitraryClass, `<Box className="flex bg-[red] p-4" />`, 1);
      expect(d!.message).toContain("bg-[red]");
    });

    it("multiple arbitrary values in one className — all listed in a single diagnostic", () => {
      const [d] = expectRuleFinds(
        noArbitraryClass,
        `<div className="w-[200px] h-[100px]">x</div>`,
        1,
      );
      expect(d!.message).toContain("w-[200px]");
      expect(d!.message).toContain("h-[100px]");
    });
  });

  describe("ignores", () => {
    it("regular utility class names without arbitrary syntax", () => {
      expectRuleClean(noArbitraryClass, `<div className="flex p-4 bg-primary">x</div>`);
    });

    it("empty className string", () => {
      expectRuleClean(noArbitraryClass, `<div className="">x</div>`);
    });

    it("elements without a className attribute", () => {
      expectRuleClean(noArbitraryClass, `<div id="root">x</div>`);
    });

    it("dynamic className expressions — cannot statically evaluate arbitrary classes", () => {
      expectRuleClean(noArbitraryClass, `<div className={computedClass}>x</div>`);
    });

    it("JSX fragments", () => {
      expectRuleClean(noArbitraryClass, `<>hello</>`);
    });

    it("empty-bracket notation — pattern requires ≥1 character between brackets", () => {
      expectRuleClean(noArbitraryClass, `<div className="bg-[]">x</div>`);
    });

    it("whitespace-only className string — splits to blank tokens, none match pattern", () => {
      expectRuleClean(noArbitraryClass, `<div className="   ">x</div>`);
    });
  });

  describe("diagnostic properties", () => {
    it("ruleId is no-arbitrary-class and severity is error", () => {
      const [d] = expectRuleFinds(noArbitraryClass, `<Box className="bg-[#fff]" />`, 1);
      expect(d!.ruleId).toBe("no-arbitrary-class");
      expect(d!.severity).toBe("error");
    });

    it("diagnostic includes the element name in the message", () => {
      const [d] = expectRuleFinds(noArbitraryClass, `<section className="bg-[blue]">x</section>`, 1);
      expect(d!.message).toContain("<section>");
    });
  });
});
