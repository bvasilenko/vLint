import { describe, it, expect } from "vitest";
import { consistentAsProp } from "../src/rules/consistent-as-prop.ts";
import { expectRuleFinds, expectRuleClean } from "./helpers.ts";

describe("consistent-as-prop", () => {
  describe("flags", () => {
    it("an uppercase component using as with a block HTML element name", () => {
      expectRuleFinds(consistentAsProp, `<Box as="div">x</Box>`, 1);
    });

    it("an uppercase component using as with an inline HTML element name", () => {
      expectRuleFinds(consistentAsProp, `<Text as="span">label</Text>`, 1);
    });

    it("an uppercase component using as with a semantic HTML element name", () => {
      expectRuleFinds(consistentAsProp, `<Card as="article">x</Card>`, 1);
    });

    it("an uppercase component using as with an anchor element", () => {
      expectRuleFinds(consistentAsProp, `<Link as="a" href="/path">x</Link>`, 1);
    });

    it("as value supplied via JSX expression container string (any string syntax form)", () => {
      expectRuleFinds(consistentAsProp, `<Box as={"div"}>x</Box>`, 1);
    });

    it("an SVG element name in the as prop", () => {
      expectRuleFinds(consistentAsProp, `<Icon as="svg">x</Icon>`, 1);
    });

    it("member-expression component with HTML tag as prop", () => {
      expectRuleFinds(consistentAsProp, `<Foo.Bar as="div">x</Foo.Bar>`, 1);
    });

    it("every matched element in a tree — accumulates all violations", () => {
      const src = `<><Box as="div">x</Box><Text as="span">y</Text></>`;
      expectRuleFinds(consistentAsProp, src, 2);
    });

    it("deeply nested member-expression component with HTML tag as prop", () => {
      expectRuleFinds(consistentAsProp, `<Foo.Bar.Baz as="div">x</Foo.Bar.Baz>`, 1);
    });
  });

  describe("ignores", () => {
    it("lowercase (HTML) elements — rule only applies to components", () => {
      expectRuleClean(consistentAsProp, `<div as="section">x</div>`);
    });

    it("components without any as prop", () => {
      expectRuleClean(consistentAsProp, `<Box p={4}>x</Box>`);
    });

    it("as prop value that is not a recognised HTML tag string", () => {
      expectRuleClean(consistentAsProp, `<Box as="Button">x</Box>`);
    });

    it("as prop supplied as a JSX expression (component reference — not a string)", () => {
      expectRuleClean(consistentAsProp, `<Box as={Text}>x</Box>`);
    });

    it("namespaced JSX tags are not considered components", () => {
      expectRuleClean(consistentAsProp, `<foo:bar as="div">x</foo:bar>`);
    });
  });

  describe("diagnostic properties", () => {
    it("diagnostic carries ruleId, severity, component name, and as value in message", () => {
      const [d] = expectRuleFinds(consistentAsProp, `<Box as="div">x</Box>`, 1);
      expect(d!.ruleId).toBe("consistent-as-prop");
      expect(d!.severity).toBe("warn");
      expect(d!.message).toContain("<Box");
      expect(d!.message).toContain('as="div"');
    });
  });
});
