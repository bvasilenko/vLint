// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { Command } from "commander";
import pc from "picocolors";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lint, lintGlob } from "./lint.ts";
import type { Diagnostic, LintConfig } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

function packageVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../package.json"), "utf-8"),
    ) as { version: string };
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

function severityLabel(d: Diagnostic): string {
  return d.severity === "error" ? pc.red("error") : pc.yellow("warn");
}

function formatDiagnostic(d: Diagnostic): string {
  const loc = `${d.file}:${d.line}:${d.column}`;
  return `  ${severityLabel(d)}  ${pc.gray(loc)}  ${d.message}  ${pc.dim(d.ruleId)}`;
}

function printResults(diagnostics: Diagnostic[]): void {
  for (const d of diagnostics) {
    process.stdout.write(formatDiagnostic(d) + "\n");
  }
}

function summarize(diagnostics: Diagnostic[]): void {
  const errors = diagnostics.filter(d => d.severity === "error").length;
  const warns = diagnostics.filter(d => d.severity === "warn").length;
  const parts: string[] = [];
  if (errors > 0) parts.push(pc.red(`${errors} error${errors === 1 ? "" : "s"}`));
  if (warns > 0) parts.push(pc.yellow(`${warns} warning${warns === 1 ? "" : "s"}`));
  if (parts.length > 0) {
    process.stdout.write(`\n${parts.join(", ")}\n`);
  }
}

async function run(files: string[], opts: { config?: string }): Promise<void> {
  let extraConfig: Partial<LintConfig> = {};
  if (opts.config) {
    try {
      extraConfig = JSON.parse(readFileSync(opts.config, "utf-8")) as Partial<LintConfig>;
    } catch (err) {
      process.stderr.write(`vlint: cannot read config "${opts.config}": ${(err as Error).message}\n`);
      process.exit(2);
    }
  }

  const allDiagnostics: Diagnostic[] = [];

  try {
    for (const pattern of files) {
      if (pattern.includes("*")) {
        const results = await lintGlob(pattern, extraConfig);
        for (const r of results) allDiagnostics.push(...r.diagnostics);
      } else {
        const result = lint(pattern, extraConfig);
        allDiagnostics.push(...result.diagnostics);
      }
    }
  } catch (err) {
    process.stderr.write(`vlint: ${(err as Error).message}\n`);
    process.exit(2);
  }

  printResults(allDiagnostics);
  summarize(allDiagnostics);

  const hasErrors = allDiagnostics.some(d => d.severity === "error");
  process.exit(hasErrors ? 1 : 0);
}

const program = new Command();

program
  .name("vlint")
  .description("AST linter for vDsl prop surface")
  .version(packageVersion())
  .argument("<files...>", "files or glob patterns to lint")
  .option("-c, --config <path>", "path to JSON config file")
  .action((files: string[], opts: { config?: string }) => {
    run(files, opts).catch(err => {
      process.stderr.write(`vlint: unexpected error: ${(err as Error).message}\n`);
      process.exit(2);
    });
  });

program.parse();