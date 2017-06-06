# vLint

AST linter for vDsl prop surface. Token scale validation, className/style bypass guards, `as`-prop consistency. CLI + ESLint plugin.

## Install

```bash
npm install @booga/vlint
```

## CLI

```bash
vlint src/**/*.tsx
vlint src/components/Button.tsx --config vlint.config.json
```

Exit codes: `0` clean, `1` error-severity violations, `2` internal failure.

## Programmatic

```typescript
import { lint, lintGlob, rules } from "@booga/vlint";

const result = lint("src/Button.tsx");
result.diagnostics; // { file, line, column, ruleId, message, severity }[]

const results = await lintGlob("src/**/*.tsx", {
  ignore: ["**/dist/**"],
  rules: { "valid-token-values": "error" },
  tokenScale: [0, 1, 2, 3, 4, 6, 8, 12, 16],
});
```

## ESLint plugin

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["vlint"],
  extends: ["plugin:vlint/recommended"],
};
```

## Config

```typescript
import { LintConfigSchema } from "@booga/vlint";

// All fields optional — schema shows defaults
LintConfigSchema.parse({
  rules: { "valid-token-values": "error" },
  ignore: ["**/node_modules/**", "**/dist/**"],
  tokenScale: [0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24],
  tokenProps: ["p", "px", "py", "m", "mx", "my", "gap", "w", "h"],
});
```

## Rules

| Rule | Default | What it flags |
|---|---|---|
| `no-raw-classname` | error | `className` on any lowercase HTML element |
| `no-raw-style` | error | `style` prop on any JSX element |
| `valid-token-values` | warn | Token prop values not in the declared scale |
| `no-arbitrary-class` | error | Tailwind arbitrary values like `bg-[#fff]` |
| `consistent-as-prop` | warn | `as="div"` polymorphism with raw HTML tags on vDsl components |

## Contributing

Code of conduct: [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

## License

MIT © 2026 bvasilenko
