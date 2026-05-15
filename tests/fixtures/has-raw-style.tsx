// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
export function BadStyle() {
  return <div style={{ color: "red", padding: 8 }}>hello</div>;
}

export function BadStyleOnComponent() {
  return <span style={{ margin: "0 auto" }}>text</span>;
}
