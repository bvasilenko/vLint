
import type { JSXOpeningElement } from "@babel/types";

export type Severity = "error" | "warn";

export type RuleSwitch = "off" | "warn" | "error";

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  ruleId: string;
  message: string;
  severity: Severity;
}

export interface RuleContext {
  readonly file: string;
  readonly source: string;
  readonly tokenScale: ReadonlySet<number>;
  readonly tokenProps: ReadonlySet<string>;
}

export interface Rule {
  readonly id: string;
  readonly severity: Severity;
  check(node: JSXOpeningElement, context: RuleContext): Diagnostic[];
}

export interface LintResult {
  file: string;
  diagnostics: Diagnostic[];
}

export interface LintConfig {
  rules: Record<string, RuleSwitch>;
  ignore: string[];
  tokenScale: number[];
  tokenProps: string[];
}