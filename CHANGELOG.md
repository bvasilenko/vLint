# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-05-18

### Fixed

- Optional peer dependency was declared as `@booga/vDsl` (capital D) — not a
  valid npm scoped package name, so it could never resolve — and pinned to the
  stale `^0.1`. Corrected to `@booga/vdsl@^0.2.0`.

## [0.1.0] - 2026-05-15

### Added

- `lint(file, opts)` — single-file AST linting
- `lintGlob(pattern, opts)` — multi-file glob linting with ignore support
- Rule `no-raw-classname` — flags `className` on HTML elements
- Rule `no-raw-style` — flags `style` prop on any JSX element
- Rule `valid-token-values` — flags token prop values not in declared scale
- Rule `no-arbitrary-class` — flags Tailwind arbitrary value syntax
- Rule `consistent-as-prop` — flags `as` prop with raw HTML tag strings
- ESLint plugin with `recommended` config
- CLI (`vlint`) with exit codes 0/1/2
- `LintConfigSchema` — zod schema for config validation
