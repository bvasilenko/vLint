// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBunBinary } from "./bun-resolver.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLI = resolve(ROOT, "src/cli.ts");
const FIXTURES = resolve(ROOT, "tests/fixtures");
const BUN = resolveBunBinary();

function runCli(args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(BUN, ["run", CLI, ...args], {
    cwd: ROOT,
    encoding: "utf-8",
    env: { ...process.env, BUN_PATH: BUN },
  });
  return {
    status: result.status ?? 2,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("CLI", () => {
  it("exits 0 on a clean file", () => {
    const { status } = runCli([`${FIXTURES}/clean.tsx`]);
    expect(status).toBe(0);
  });

  it("exits 1 when error-severity diagnostics are found", () => {
    const { status } = runCli([`${FIXTURES}/has-raw-classname.tsx`]);
    expect(status).toBe(1);
  });

  it("prints diagnostics to stdout", () => {
    const { stdout } = runCli([`${FIXTURES}/has-raw-classname.tsx`]);
    expect(stdout).toContain("no-raw-classname");
  });

  it("exits 1 for raw style violations", () => {
    const { status } = runCli([`${FIXTURES}/has-raw-style.tsx`]);
    expect(status).toBe(1);
  });

  it("exits 2 on a non-existent file", () => {
    const { status, stderr } = runCli(["nonexistent-file.tsx"]);
    expect(status).toBe(2);
    expect(stderr).toContain("vlint:");
  });

  it("accepts multiple file arguments", () => {
    const { status } = runCli([
      `${FIXTURES}/clean.tsx`,
      `${FIXTURES}/has-raw-classname.tsx`,
    ]);
    expect(status).toBe(1);
  });

  it("prints --version", () => {
    const { stdout, status } = runCli(["--version"]);
    expect(status).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
