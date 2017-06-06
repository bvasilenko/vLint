
import { z } from "zod";
import type { LintConfig, RuleSwitch, Severity } from "./types.ts";

const DEFAULT_TOKEN_SCALE: number[] = [
  0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44,
  48, 52, 56, 60, 64, 72, 80, 96,
];

const DEFAULT_TOKEN_PROPS: string[] = [
  "p", "px", "py", "pt", "pb", "pl", "pr",
  "m", "mx", "my", "mt", "mb", "ml", "mr",
  "gap", "gapX", "gapY",
  "w", "h", "minW", "minH", "maxW", "maxH",
  "top", "right", "bottom", "left", "inset",
  "space", "spaceX", "spaceY",
  "size", "basis",
  "rounded", "roundedT", "roundedR", "roundedB", "roundedL",
];

export const LintConfigSchema = z
  .object({
    rules: z.record(z.enum(["off", "warn", "error"])).default({}),
    ignore: z
      .array(z.string())
      .default(["**/node_modules/**", "**/dist/**"]),
    tokenScale: z.array(z.number()).default(DEFAULT_TOKEN_SCALE),
    tokenProps: z.array(z.string()).default(DEFAULT_TOKEN_PROPS),
  })
  .strict();

export type LintConfigInput = z.input<typeof LintConfigSchema>;

export function resolveConfig(input: Partial<LintConfigInput> = {}): LintConfig {
  return LintConfigSchema.parse(input);
}

export function effectiveSeverity(
  ruleId: string,
  ruleSeverity: Severity,
  configRules: Record<string, RuleSwitch>,
): Severity | "off" {
  const override = configRules[ruleId];
  if (override === undefined) return ruleSeverity;
  if (override === "off") return "off";
  return override;
}