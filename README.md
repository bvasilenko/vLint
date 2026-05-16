# vLint

AST linter for vDsl prop surface. Token scale validation, className/style bypass guards, `as`-prop consistency. CLI + ESLint plugin.

## Why

A design system holds only while every component uses it. The first hand-typed `className="mt-[13px]"`, `style={{padding: 7}}`, or `bg-[#3a3a3a]` is a hole. Nothing stops it — types pass, build is green, the screen renders. The erosion is invisible until it is irreversible: months later half the app tracks the tokens and half is frozen ad-hoc pixels and hardcoded hex, theme changes propagate to one half, dark mode breaks in scattered places, the 8px grid is full of 7px and 13px gaps.

vLint is the watchdog against that drift. Each escape from the vDsl surface is caught at lint time — on the pull request that introduced it — not discovered as rot a year later. Without vLint you have a design system everyone bypasses; with it, bypassing the system fails the build.

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

| Rule | Default | What it flags | Drift it prevents |
|---|---|---|---|
| `no-raw-classname` | error | `className` on any lowercase HTML element | margins/padding that never track theme or spacing changes |
| `no-raw-style` | error | `style` prop on any JSX element | inline pixel values off the 8px grid, frozen and unthemeable |
| `valid-token-values` | warn | Token prop values not in the declared scale | off-grid spacing that breaks rhythm across screens |
| `no-arbitrary-class` | error | Tailwind arbitrary values like `bg-[#fff]` | hardcoded hex that breaks dark mode and palette changes |
| `consistent-as-prop` | warn | `as="div"` polymorphism with raw HTML tags on vDsl components | polymorphic components downgraded to raw tags, losing semantic + styling guarantees |

## Contributing

Code of conduct: [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

## License

MIT © 2026 bvasilenko
