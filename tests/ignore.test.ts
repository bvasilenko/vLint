import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { lintGlob } from "../src/lint.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "fixtures");

describe("lintGlob", () => {
  describe("result shape", () => {
    it("returns an array where each entry has file and diagnostics fields", async () => {
      const results = await lintGlob(`${FIXTURES}/*.tsx`, { ignore: [] });
      for (const r of results) {
        expect(r).toHaveProperty("file");
        expect(r).toHaveProperty("diagnostics");
        expect(Array.isArray(r.diagnostics)).toBe(true);
      }
    });

    it("returns results for files matching the glob pattern", async () => {
      const results = await lintGlob(`${FIXTURES}/*.tsx`, { ignore: [] });
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns an empty array when the pattern matches no files", async () => {
      const results = await lintGlob(`${FIXTURES}/**/*.nonexistent`, { ignore: [] });
      expect(results).toHaveLength(0);
    });

    it("a clean file produces zero diagnostics", async () => {
      const results = await lintGlob(`${FIXTURES}/clean.tsx`, { ignore: [] });
      expect(results).toHaveLength(1);
      expect(results[0]!.diagnostics).toHaveLength(0);
    });
  });

  describe("ignore config", () => {
    it("files matching an ignore pattern are excluded from results", async () => {
      const withIgnore = await lintGlob(`${FIXTURES}/**/*.tsx`, {
        ignore: [`${FIXTURES}/ignored/**`],
      });
      const withoutIgnore = await lintGlob(`${FIXTURES}/**/*.tsx`, { ignore: [] });

      const ignoredPaths = withoutIgnore
        .map(r => r.file)
        .filter(f => f.includes("ignored"));
      expect(ignoredPaths.length).toBeGreaterThan(0);

      const keptPaths = withIgnore.map(r => r.file);
      for (const f of ignoredPaths) {
        expect(keptPaths).not.toContain(f);
      }
    });

    it("returns an empty array when every file matches an ignore pattern", async () => {
      const results = await lintGlob(`${FIXTURES}/**/*.tsx`, {
        ignore: [`${FIXTURES}/**`],
      });
      expect(results).toHaveLength(0);
    });

    it("non-ignored files remain in results when only some are ignored", async () => {
      const results = await lintGlob(`${FIXTURES}/**/*.tsx`, {
        ignore: [`${FIXTURES}/ignored/**`],
      });
      const paths = results.map(r => r.file);
      expect(paths.some(p => p.includes("clean"))).toBe(true);
    });
  });

  describe("glob pattern features", () => {
    it("supports brace expansion — {tsx,ts} matches both extensions", async () => {
      const results = await lintGlob(`${FIXTURES}/*.{tsx,ts}`, { ignore: [] });
      expect(results.length).toBeGreaterThan(0);
    });

    it("supports ** recursive glob", async () => {
      const flat = await lintGlob(`${FIXTURES}/*.tsx`, { ignore: [] });
      const recursive = await lintGlob(`${FIXTURES}/**/*.tsx`, { ignore: [] });
      expect(recursive.length).toBeGreaterThanOrEqual(flat.length);
    });
    it("supports ? wildcard — matches any single non-separator character", async () => {
      const results = await lintGlob(`${FIXTURES}/clea?.tsx`, { ignore: [] });
      expect(results).toHaveLength(1);
      expect(results[0]!.file).toContain("clean.tsx");
    });
  });

  describe("rule configuration threading", () => {
    it("disabling a rule via config suppresses its diagnostics across all matched files", async () => {
      const withRule = await lintGlob(`${FIXTURES}/has-raw-classname.tsx`, { ignore: [] });
      const withOff = await lintGlob(`${FIXTURES}/has-raw-classname.tsx`, {
        ignore: [],
        rules: { "no-raw-classname": "off" },
      });

      expect(withRule[0]!.diagnostics.some(d => d.ruleId === "no-raw-classname")).toBe(true);
      expect(withOff[0]!.diagnostics.some(d => d.ruleId === "no-raw-classname")).toBe(false);
    });

    it("overriding warn to error changes the severity in returned diagnostics", async () => {
      const results = await lintGlob(`${FIXTURES}/has-invalid-token.tsx`, {
        ignore: [],
        tokenScale: [0, 1, 2, 3, 4, 6, 8],
        rules: { "valid-token-values": "error" },
      });
      const tokenDiags = results.flatMap(r => r.diagnostics).filter(d => d.ruleId === "valid-token-values");
      expect(tokenDiags.length).toBeGreaterThan(0);
      expect(tokenDiags.every(d => d.severity === "error")).toBe(true);
    });
  });

  describe("error propagation", () => {
    it("rejects when a matched file cannot be parsed", async () => {
      const badFile = `${tmpdir()}/vlint-test-glob-unparseable-${process.pid}.tsx`;
      writeFileSync(badFile, "<<< not valid JSX >>>");
      try {
        await expect(lintGlob(badFile, { ignore: [] })).rejects.toThrow(/vlint.*parse error/i);
      } finally {
        unlinkSync(badFile);
      }
    });
  });
});
