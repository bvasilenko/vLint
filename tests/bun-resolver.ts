// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const KNOWN_PATHS = [
  `${process.env["HOME"] ?? ""}/.bun/bin/bun`,
  "/usr/local/bin/bun",
  "/usr/bin/bun",
] as const;

function fromPath(): string | undefined {
  const result = spawnSync("which", ["bun"], { encoding: "utf-8" });
  if (result.status === 0) return result.stdout.trim() || undefined;
  return undefined;
}

function fromKnownLocations(): string | undefined {
  return KNOWN_PATHS.find(existsSync);
}

export function resolveBunBinary(): string {
  const env = process.env["BUN_PATH"];
  if (env) return env;

  const found = fromPath() ?? fromKnownLocations();
  if (found) return found;

  throw new Error(
    "bun binary not found — install bun or set the BUN_PATH environment variable.",
  );
}
