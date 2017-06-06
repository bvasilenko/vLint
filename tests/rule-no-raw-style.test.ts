import { describe, it, expect } from "vitest";
import { noRawStyle } from "../src/rules/no-raw-style.ts";
import { expectRuleFinds, expectRuleClean } from "./helpers.ts";

describe("no-raw-style", () => {
  describe("flags", () => {
    it("any element carrying a style attribute — HTML elements", () => {
      expectRuleFinds(noRawStyle, `<div style={{ color: "red" }}>x</div>`, 1);
    });

    it("uppercase components carrying a style attribute", () => {
      expectRuleFinds(noRawStyle, `<Box style={{ padding: 8 }}>x</Box>`, 1);
    });

    it("style supplied as any expression, not only object literals", () => {
      expectRuleFinds(noRawStyle, `<span style={myStyles}>x</span>`, 1);
    });

    it("every matched element in a tree — accumulates all violations", () => {
      const src = `<><div style={{}}>a</div><span style={{ margin: 0 }}>b</span></>`;
      expectRuleFinds(noRawStyle, src, 2);
    });

    it("JSX member-expression component with style attribute", () => {
      expectRuleFinds(noRawStyle, `<Foo.Bar style={{ color: "red" }}>x</Foo.Bar>`, 1);
    });

    it("namespaced JSX element with style attribute", () => {
      expectRuleFinds(noRawStyle, `<foo:bar style={{}}>x</foo:bar>`, 1);
    });

    it("element with style attribute present alongside spread props — style is still detected", () => {
      expectRuleFinds(noRawStyle, `<div {...props} style={{}}>x</div>`, 1);
    });
  });

  describe("ignores", () => {
    it("any element without a style attribute", () => {
      expectRuleClean(noRawStyle, `<div className="p-4">x</div>`);
    });

    it("JSX fragments", () => {
      expectRuleClean(noRawStyle, `<>hello</>`);
    });

    it("elements with spread attributes only (style not statically detectable)", () => {
      expectRuleClean(noRawStyle, `<div {...props}>x</div>`);
    });
  });

  describe("diagnostic properties", () => {
    it("ruleId is no-raw-style and severity is error", () => {
      const [d] = expectRuleFinds(noRawStyle, `<div style={{}}>x</div>`, 1);
      expect(d!.ruleId).toBe("no-raw-style");
      expect(d!.severity).toBe("error");
    });

    it("diagnostic includes the HTML element name in the message", () => {
      const [d] = expectRuleFinds(noRawStyle, `<section style={{}}>x</section>`, 1);
      expect(d!.message).toContain("<section>");
    });

    it("diagnostic uses 'element' as fallback label for unresolvable tag names (namespaced)", () => {
      const [d] = expectRuleFinds(noRawStyle, `<foo:bar style={{}}>x</foo:bar>`, 1);
      expect(d!.message).toContain("element");
    });

    it("diagnostic includes the member-expression tag name in the message", () => {
      const [d] = expectRuleFinds(noRawStyle, `<Foo.Bar style={{}}>x</Foo.Bar>`, 1);
      expect(d!.message).toContain("Foo.Bar");
    });
  });
});
