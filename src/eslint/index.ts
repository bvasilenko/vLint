
import { rules as vlintRules } from "../rules/index.ts";
import { adaptRule } from "./adapter.ts";
import type { EslintRule } from "./adapter.ts";

const eslintRules: Record<string, EslintRule> = Object.fromEntries(
  Object.entries(vlintRules).map(([id, rule]) => [id, adaptRule(rule)]),
);

export const eslintPlugin = {
  rules: eslintRules,
  configs: {
    recommended: {
      plugins: ["vlint"],
      rules: Object.fromEntries(
        Object.entries(vlintRules).map(([id, rule]) => [
          `vlint/${id}`,
          rule.severity === "error" ? "error" : "warn",
        ]),
      ),
    },
  },
};