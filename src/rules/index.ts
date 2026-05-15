// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import type { Rule } from "../types.ts";
import { noRawClassname } from "./no-raw-classname.ts";
import { noRawStyle } from "./no-raw-style.ts";
import { validTokenValues } from "./valid-token-values.ts";
import { noArbitraryClass } from "./no-arbitrary-class.ts";
import { consistentAsProp } from "./consistent-as-prop.ts";

export const rules: Readonly<Record<string, Rule>> = {
  "no-raw-classname": noRawClassname,
  "no-raw-style": noRawStyle,
  "valid-token-values": validTokenValues,
  "no-arbitrary-class": noArbitraryClass,
  "consistent-as-prop": consistentAsProp,
};