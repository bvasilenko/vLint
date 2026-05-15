// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import { LintConfigSchema, resolveConfig, effectiveSeverity } from "../src/config.ts";

describe("LintConfigSchema", () => {
  describe("parsing valid input", () => {
    it("accepts empty input and returns all defaults", () => {
      const config = LintConfigSchema.parse({});
      expect(config.ignore).toEqual(expect.arrayContaining(["**/node_modules/**", "**/dist/**"]));
      expect(config.rules).toEqual({});
      expect(config.tokenScale.length).toBeGreaterThan(0);
      expect(config.tokenProps.length).toBeGreaterThan(0);
    });

    it("accepts a custom rules record with all valid switch values", () => {
      const config = LintConfigSchema.parse({
        rules: { "no-raw-style": "off", "valid-token-values": "error", "no-arbitrary-class": "warn" },
      });
      expect(config.rules["no-raw-style"]).toBe("off");
      expect(config.rules["valid-token-values"]).toBe("error");
      expect(config.rules["no-arbitrary-class"]).toBe("warn");
    });

    it("accepts a custom tokenScale, replacing the default", () => {
      const config = LintConfigSchema.parse({ tokenScale: [0, 2, 4, 8] });
      expect(config.tokenScale).toEqual([0, 2, 4, 8]);
    });

    it("accepts a custom tokenProps list", () => {
      const config = LintConfigSchema.parse({ tokenProps: ["p", "m"] });
      expect(config.tokenProps).toEqual(["p", "m"]);
    });

    it("accepts a custom ignore list", () => {
      const config = LintConfigSchema.parse({ ignore: ["**/generated/**"] });
      expect(config.ignore).toEqual(["**/generated/**"]);
    });
  });

  describe("rejecting invalid input", () => {
    it("rejects unknown fields (strict mode)", () => {
      expect(() => LintConfigSchema.parse({ unknown: true })).toThrow();
    });

    it("rejects invalid rule switch values", () => {
      expect(() => LintConfigSchema.parse({ rules: { "no-raw-style": "maybe" } })).toThrow();
    });
  });
});

describe("resolveConfig", () => {
  it("returns a fully-populated config with defaults when called with no arguments", () => {
    const config = resolveConfig();
    expect(config.rules).toBeDefined();
    expect(config.ignore).toBeDefined();
    expect(config.tokenScale).toBeDefined();
    expect(config.tokenProps).toBeDefined();
  });

  it("merges provided partial input with defaults for unspecified fields", () => {
    const config = resolveConfig({ tokenScale: [0, 1, 2] });
    expect(config.tokenScale).toEqual([0, 1, 2]);
    expect(config.ignore.length).toBeGreaterThan(0);
    expect(config.tokenProps.length).toBeGreaterThan(0);
  });
});

describe("effectiveSeverity", () => {
  it("returns the rule's own default severity when the config has no override", () => {
    expect(effectiveSeverity("no-raw-style", "error", {})).toBe("error");
    expect(effectiveSeverity("valid-token-values", "warn", {})).toBe("warn");
  });

  it("returns 'off' when the rule is disabled in config", () => {
    expect(effectiveSeverity("no-raw-style", "error", { "no-raw-style": "off" })).toBe("off");
  });

  it("returns the config's override when set to 'warn'", () => {
    expect(effectiveSeverity("no-raw-style", "error", { "no-raw-style": "warn" })).toBe("warn");
  });

  it("returns the config's override when set to 'error'", () => {
    expect(effectiveSeverity("valid-token-values", "warn", { "valid-token-values": "error" })).toBe("error");
  });

  it("override only affects the targeted rule, not others", () => {
    const rules = { "no-raw-style": "off" } as const;
    expect(effectiveSeverity("no-raw-classname", "error", rules)).toBe("error");
  });
});
