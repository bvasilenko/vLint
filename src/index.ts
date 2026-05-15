// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

export { lint, lintGlob } from "./lint.ts";
export { rules } from "./rules/index.ts";
export { eslintPlugin } from "./eslint/index.ts";
export { LintConfigSchema } from "./config.ts";
export type { Diagnostic, LintResult, LintConfig, Rule, RuleContext, Severity, RuleSwitch } from "./types.ts";