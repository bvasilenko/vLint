// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lint } from "../src/lint.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "fixtures");

describe("lint()", () => {
  describe("success path", () => {
    it("returns a LintResult with file and diagnostics fields", () => {
      const result = lint(`${FIXTURES}/clean.tsx`);
      expect(result).toHaveProperty("file");
      expect(result).toHaveProperty("diagnostics");
      expect(Array.isArray(result.diagnostics)).toBe(true);
    });

    it("returns the exact file path that was passed in", () => {
      const path = `${FIXTURES}/clean.tsx`;
      expect(lint(path).file).toBe(path);
    });

    it("produces zero diagnostics for a file with no violations", () => {
      expect(lint(`${FIXTURES}/clean.tsx`).diagnostics).toHaveLength(0);
    });

    it("produces diagnostics for a file with violations", () => {
      expect(lint(`${FIXTURES}/has-raw-classname.tsx`).diagnostics.length).toBeGreaterThan(0);
    });

    it("each diagnostic carries file, line, column, ruleId, message, and severity", () => {
      const { diagnostics } = lint(`${FIXTURES}/has-raw-classname.tsx`);
      const [d] = diagnostics;
      expect(d).toHaveProperty("file");
      expect(d).toHaveProperty("line");
      expect(d).toHaveProperty("column");
      expect(d).toHaveProperty("ruleId");
      expect(d).toHaveProperty("message");
      expect(d).toHaveProperty("severity");
    });
  });

  describe("option threading", () => {
    it("respects tokenScale option — values absent from scale are flagged", () => {
      const { diagnostics } = lint(`${FIXTURES}/has-invalid-token.tsx`, {
        tokenScale: [0, 1, 2, 3, 4, 6, 8],
      });
      expect(diagnostics.some(d => d.ruleId === "valid-token-values")).toBe(true);
    });

    it("disabling a rule via rules option suppresses its diagnostics", () => {
      const withRule = lint(`${FIXTURES}/has-raw-classname.tsx`);
      const withOff = lint(`${FIXTURES}/has-raw-classname.tsx`, {
        rules: { "no-raw-classname": "off" },
      });

      expect(withRule.diagnostics.some(d => d.ruleId === "no-raw-classname")).toBe(true);
      expect(withOff.diagnostics.some(d => d.ruleId === "no-raw-classname")).toBe(false);
    });

    it("overriding a rule severity changes the severity in returned diagnostics", () => {
      const result = lint(`${FIXTURES}/has-invalid-token.tsx`, {
        tokenScale: [0, 1, 2, 3, 4, 6, 8],
        rules: { "valid-token-values": "error" },
      });
      const tokenDiags = result.diagnostics.filter(d => d.ruleId === "valid-token-values");
      expect(tokenDiags.length).toBeGreaterThan(0);
      expect(tokenDiags.every(d => d.severity === "error")).toBe(true);
    });
  });

  describe("error paths", () => {
    it("throws a descriptive error when the file does not exist", () => {
      expect(() => lint("/nonexistent/path/file.tsx")).toThrow(/vlint.*cannot read file/i);
    });

    it("throws a descriptive error when the file content cannot be parsed", () => {
      const badFile = `/tmp/vlint-test-unparseable-${process.pid}.tsx`;
      const { writeFileSync, unlinkSync } = require("node:fs");
      writeFileSync(badFile, "<<< not valid JSX or TS >>>");
      try {
        expect(() => lint(badFile)).toThrow(/vlint.*parse error/i);
      } finally {
        unlinkSync(badFile);
      }
    });
  });
});
