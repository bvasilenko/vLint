// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { resolveBunBinary } from "./bun-resolver.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESOLVER_MODULE = resolve(__dirname, "bun-resolver.ts");

function withEnv<T>(overrides: Record<string, string | undefined>, fn: () => T): T {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    saved[key] = process.env[key];
    if (overrides[key] === undefined) delete process.env[key];
    else process.env[key] = overrides[key];
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

function runResolverIsolated(env: Record<string, string>): {
  stderr: string;
  status: number | null;
} {
  const bunBinary = resolveBunBinary();
  const tmpFile = resolve(tmpdir(), `vlint-resolver-probe-${process.pid}.ts`);
  const script = [
    `import { resolveBunBinary } from "${RESOLVER_MODULE}";`,
    `try {`,
    `  process.stdout.write(resolveBunBinary());`,
    `  process.exit(0);`,
    `} catch (e) {`,
    `  process.stderr.write(e instanceof Error ? e.message : String(e));`,
    `  process.exit(1);`,
    `}`,
  ].join("\n");
  writeFileSync(tmpFile, script);
  try {
    const result = spawnSync(bunBinary, ["run", tmpFile], { encoding: "utf-8", env });
    return { stderr: result.stderr ?? "", status: result.status };
  } finally {
    unlinkSync(tmpFile);
  }
}

describe("resolveBunBinary", () => {
  describe("BUN_PATH environment variable", () => {
    it("returns BUN_PATH verbatim when set to any non-empty string", () => {
      expect(
        withEnv({ BUN_PATH: "/any/custom/bun" }, () => resolveBunBinary()),
      ).toBe("/any/custom/bun");
    });

    it("does not validate BUN_PATH — trusts the caller to supply a valid executable", () => {
      expect(
        withEnv({ BUN_PATH: "/nonexistent/bun" }, () => resolveBunBinary()),
      ).toBe("/nonexistent/bun");
    });

    it("ignores an empty-string BUN_PATH and falls through to discovery", () => {
      const result = withEnv({ BUN_PATH: "" }, () => resolveBunBinary());
      expect(result).not.toBe("");
      expect(result.length).toBeGreaterThan(0);
    });

    it("BUN_PATH takes precedence over PATH-based discovery", () => {
      const sentinel = "/sentinel/bun";
      expect(
        withEnv({ BUN_PATH: sentinel }, () => resolveBunBinary()),
      ).toBe(sentinel);
    });
  });

  describe("resolved binary contract", () => {
    it("returns a non-empty string when bun is available in the environment", () => {
      const result = withEnv({ BUN_PATH: undefined }, () => resolveBunBinary());
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("returned path points to an existing file on disk", () => {
      const result = withEnv({ BUN_PATH: undefined }, () => resolveBunBinary());
      expect(existsSync(result)).toBe(true);
    });

    it("returned binary responds to --version with a semver string", () => {
      const bunPath = withEnv({ BUN_PATH: undefined }, () => resolveBunBinary());
      const { status, stdout } = spawnSync(bunPath, ["--version"], { encoding: "utf-8" });
      expect(status).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });

    it("returns the same path on successive calls in the same environment", () => {
      const first = withEnv({ BUN_PATH: undefined }, () => resolveBunBinary());
      const second = withEnv({ BUN_PATH: undefined }, () => resolveBunBinary());
      expect(first).toBe(second);
    });
  });

  describe("error path", () => {
    it("throws an Error with a BUN_PATH hint when bun cannot be found by any method", () => {
      const { status, stderr } = runResolverIsolated({ PATH: "/no-bun-here", HOME: "/no-bun-here" });
      expect(status).toBe(1);
      expect(stderr).toMatch(/BUN_PATH/i);
    });
  });
});
