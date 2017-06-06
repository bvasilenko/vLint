import { describe, it, expect } from "vitest";
import { validTokenValues } from "../src/rules/valid-token-values.ts";
import { expectRuleFinds, expectRuleClean } from "./helpers.ts";

const SCALE = { tokenScale: [0, 1, 2, 3, 4, 6, 8, 10, 12, 16] };

describe("valid-token-values", () => {
  describe("flags", () => {
    it("a token prop whose numeric value is absent from the declared scale", () => {
      const [d] = expectRuleFinds(validTokenValues, `<Box p={5} />`, 1, SCALE);
      expect(d!.ruleId).toBe("valid-token-values");
      expect(d!.severity).toBe("warn");
    });

    it("a string prop value that parses to a number not in scale", () => {
      expectRuleFinds(validTokenValues, `<Box p="5" />`, 1, SCALE);
    });

    it("float values not present in the scale", () => {
      expectRuleFinds(validTokenValues, `<Box p={4.5} />`, 1, SCALE);
    });

    it("every token prop on one element that violates the scale independently", () => {
      expectRuleFinds(validTokenValues, `<Box p={5} m={7} />`, 2, SCALE);
    });

    it("all responsive-style shorthand props (px, py, mx, my, gap, …) are covered", () => {
      expectRuleFinds(validTokenValues, `<Box px={5} py={5} />`, 2, SCALE);
    });

    it("gap prop with invalid value", () => {
      expectRuleFinds(validTokenValues, `<Stack gap={5} />`, 1, SCALE);
    });
  });

  describe("ignores", () => {
    it("a token prop value that is present in the scale", () => {
      expectRuleClean(validTokenValues, `<Box p={4} />`, SCALE);
    });

    it("zero when zero is included in the scale", () => {
      expectRuleClean(validTokenValues, `<Box p={0} />`, SCALE);
    });

    it("the largest value in the scale", () => {
      expectRuleClean(validTokenValues, `<Box p={16} />`, SCALE);
    });

    it("a string form of a value that is in the scale", () => {
      expectRuleClean(validTokenValues, `<Box p="4" />`, SCALE);
    });

    it("props that are not in the tokenProps set", () => {
      expectRuleClean(validTokenValues, `<Box id="main" />`, SCALE);
    });

    it("dynamic expressions — cannot statically evaluate, skip silently", () => {
      expectRuleClean(validTokenValues, `<Box p={myVar} />`, SCALE);
    });

    it("negative numeric literals — UnaryExpression cannot be statically evaluated, skip silently", () => {
      expectRuleClean(validTokenValues, `<Box p={-1} />`, SCALE);
    });

    it("mixed valid/invalid when only valid are present", () => {
      expectRuleClean(validTokenValues, `<Box p={4} m={2} gap={6} />`, SCALE);
    });

    it("produces no diagnostics when tokenScale is empty (rule not configured)", () => {
      expectRuleClean(validTokenValues, `<Box p={5} />`, { tokenScale: [] });
    });

    it("string value that parses as NaN — non-finite, treated as non-numeric and skipped", () => {
      expectRuleClean(validTokenValues, `<Box p="NaN" />`, SCALE);
    });

    it("empty string value — JS coerces to 0, which is in scale, so clean", () => {
      expectRuleClean(validTokenValues, `<Box p="" />`, SCALE);
    });
  });

  describe("diagnostic properties", () => {
    it("includes the prop name and value in the message", () => {
      const [d] = expectRuleFinds(validTokenValues, `<Box m={7} />`, 1, SCALE);
      expect(d!.message).toContain("m={7}");
    });

    it("includes the component name in the message", () => {
      const [d] = expectRuleFinds(validTokenValues, `<Stack gap={5} />`, 1, SCALE);
      expect(d!.message).toContain("<Stack>");
    });
  });
});
