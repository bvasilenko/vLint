// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";
import { eslintPlugin } from "../src/eslint/index.ts";
import { toJsxOpeningElement } from "../src/eslint/estree-bridge.ts";

const RULE_IDS = [
  "no-raw-classname",
  "no-raw-style",
  "valid-token-values",
  "no-arbitrary-class",
  "consistent-as-prop",
] as const;

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2022, ecmaFeatures: { jsx: true }, sourceType: "module" },
});

function jsxNode(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { type: "JSXOpeningElement", range: [0, 10] as [number, number], attributes: [], ...overrides };
}

function jsxAttr(name: string, value: unknown): Record<string, unknown> {
  return { type: "JSXAttribute", name: { type: "JSXIdentifier", name }, value };
}

function estreeStringLiteral(value: string): Record<string, unknown> {
  return { type: "Literal", value };
}

function estreeNumericLiteral(value: number): Record<string, unknown> {
  return { type: "Literal", value };
}

function jsxExprContainer(expression: Record<string, unknown>): Record<string, unknown> {
  return { type: "JSXExpressionContainer", expression };
}

function attrValue(result: ReturnType<typeof toJsxOpeningElement>, index = 0): Record<string, unknown> {
  return (result!.attributes[index] as unknown as { value: Record<string, unknown> }).value;
}

function attrValueExpr(result: ReturnType<typeof toJsxOpeningElement>, index = 0): Record<string, unknown> {
  return (attrValue(result, index) as { expression: Record<string, unknown> }).expression;
}

describe("ESLint plugin shape", () => {
  it("exports a rules record", () => {
    expect(eslintPlugin.rules).toBeDefined();
    expect(typeof eslintPlugin.rules).toBe("object");
  });

  it("exports a configs object with a recommended key", () => {
    expect(eslintPlugin.configs).toHaveProperty("recommended");
  });

  it("recommended config declares both plugins and rules entries", () => {
    const { recommended } = eslintPlugin.configs;
    expect(recommended).toHaveProperty("plugins");
    expect(recommended).toHaveProperty("rules");
  });
});

describe("ESLint plugin rules", () => {
  it("contains exactly the five vLint rules", () => {
    for (const id of RULE_IDS) {
      expect(eslintPlugin.rules).toHaveProperty(id);
    }
    expect(Object.keys(eslintPlugin.rules)).toHaveLength(RULE_IDS.length);
  });

  it("every rule has meta and create properties", () => {
    for (const id of RULE_IDS) {
      const rule = eslintPlugin.rules[id]!;
      expect(rule).toHaveProperty("meta");
      expect(rule).toHaveProperty("create");
      expect(typeof rule.create).toBe("function");
    }
  });

  it("every rule meta has type and docs fields", () => {
    for (const id of RULE_IDS) {
      const { meta } = eslintPlugin.rules[id]!;
      expect(meta).toHaveProperty("type");
      expect(meta).toHaveProperty("docs");
    }
  });

  it("recommended config prefixes every rule with 'vlint/'", () => {
    const configRuleKeys = Object.keys(eslintPlugin.configs.recommended.rules);
    for (const id of RULE_IDS) {
      expect(configRuleKeys).toContain(`vlint/${id}`);
    }
  });
});

describe("estree bridge: toJsxOpeningElement", () => {
  describe("non-JSXOpeningElement inputs", () => {
    it("returns null for null, undefined, empty object, and wrong node type", () => {
      expect(toJsxOpeningElement(null)).toBeNull();
      expect(toJsxOpeningElement(undefined)).toBeNull();
      expect(toJsxOpeningElement({})).toBeNull();
      expect(toJsxOpeningElement({ type: "Identifier", name: "x" })).toBeNull();
      expect(toJsxOpeningElement({ type: "JSXAttribute" })).toBeNull();
    });
  });

  describe("start position derivation", () => {
    it("derives start from range[0]", () => {
      const result = toJsxOpeningElement(jsxNode({ range: [42, 80] }));
      expect(result?.start).toBe(42);
    });

    it("defaults start to 0 when range is absent", () => {
      const result = toJsxOpeningElement({ type: "JSXOpeningElement", attributes: [] });
      expect(result?.start).toBe(0);
    });

    it("always uses range[0] regardless of any pre-existing start value on the node", () => {
      const result = toJsxOpeningElement(jsxNode({ range: [42, 80], start: 99 }));
      expect(result?.start).toBe(42);
    });
  });

  describe("Literal type translation — bare attribute values", () => {
    it("translates a string Literal attribute value to StringLiteral", () => {
      const result = toJsxOpeningElement(jsxNode({ attributes: [jsxAttr("className", estreeStringLiteral("p-4"))] }));
      expect(attrValue(result).type).toBe("StringLiteral");
      expect(attrValue(result).value).toBe("p-4");
    });

    it("translates a numeric Literal attribute value to NumericLiteral", () => {
      const result = toJsxOpeningElement(jsxNode({ attributes: [jsxAttr("p", estreeNumericLiteral(5))] }));
      expect(attrValue(result).type).toBe("NumericLiteral");
      expect(attrValue(result).value).toBe(5);
    });
  });

  describe("Literal type translation — expression container", () => {
    it("translates a string Literal inside JSXExpressionContainer expression to StringLiteral", () => {
      const value = jsxExprContainer(estreeStringLiteral("div"));
      const result = toJsxOpeningElement(jsxNode({ attributes: [jsxAttr("as", value)] }));
      expect(attrValue(result).type).toBe("JSXExpressionContainer");
      expect(attrValueExpr(result).type).toBe("StringLiteral");
      expect(attrValueExpr(result).value).toBe("div");
    });

    it("translates a numeric Literal inside JSXExpressionContainer expression to NumericLiteral", () => {
      const value = jsxExprContainer(estreeNumericLiteral(5));
      const result = toJsxOpeningElement(jsxNode({ attributes: [jsxAttr("p", value)] }));
      expect(attrValue(result).type).toBe("JSXExpressionContainer");
      expect(attrValueExpr(result).type).toBe("NumericLiteral");
      expect(attrValueExpr(result).value).toBe(5);
    });
  });

  describe("pass-through cases", () => {
    it("leaves ObjectExpression attribute value in JSXExpressionContainer unchanged", () => {
      const expr = { type: "ObjectExpression", properties: [] };
      const value = jsxExprContainer(expr as Record<string, unknown>);
      const result = toJsxOpeningElement(jsxNode({ attributes: [jsxAttr("style", value)] }));
      expect(attrValue(result).type).toBe("JSXExpressionContainer");
      expect(attrValueExpr(result).type).toBe("ObjectExpression");
    });

    it("leaves Identifier expression in JSXExpressionContainer unchanged", () => {
      const value = jsxExprContainer({ type: "Identifier", name: "myVar" });
      const result = toJsxOpeningElement(jsxNode({ attributes: [jsxAttr("p", value)] }));
      expect(attrValueExpr(result).type).toBe("Identifier");
    });

    it("leaves attribute value types other than Literal and JSXExpressionContainer unchanged", () => {
      const jsxElementValue = { type: "JSXElement" };
      const result = toJsxOpeningElement(
        jsxNode({ attributes: [jsxAttr("attr", jsxElementValue)] }),
      );
      expect(attrValue(result).type).toBe("JSXElement");
    });

    it("leaves a null attribute value (boolean attribute) unchanged", () => {
      const result = toJsxOpeningElement(jsxNode({ attributes: [jsxAttr("disabled", null)] }));
      expect((result!.attributes[0] as unknown as { value: unknown }).value).toBeNull();
    });

    it("leaves spread attributes (no value property) unchanged", () => {
      const spread = { type: "JSXSpreadAttribute", argument: { type: "Identifier", name: "props" } };
      const result = toJsxOpeningElement(jsxNode({ attributes: [spread] }));
      expect((result!.attributes[0] as unknown as Record<string, unknown>).type).toBe("JSXSpreadAttribute");
      expect((result!.attributes[0] as unknown as Record<string, unknown>).value).toBeUndefined();
    });

    it("preserves non-attribute node properties on the translated node", () => {
      const node = jsxNode({
        range: [0, 10],
        name: { type: "JSXIdentifier", name: "Box" },
        selfClosing: false,
      });
      const result = toJsxOpeningElement(node);
      expect((result as unknown as Record<string, unknown>)["selfClosing"]).toBe(false);
      expect((result as unknown as Record<string, unknown>)["name"]).toEqual(node["name"]);
    });
  });
});

describe("ESLint rule adapter", () => {
  it("JSXOpeningElement visitor silently ignores nodes that fail bridge translation", () => {
    const reports: unknown[] = [];
    const context = {
      getFilename: () => "test.tsx",
      getSourceCode: () => ({ getText: () => "" }),
      report: (opts: unknown) => { reports.push(opts); },
      options: [],
    };
    const visitor = eslintPlugin.rules["no-raw-style"]!.create(context);
    visitor["JSXOpeningElement"]!({ type: "Identifier", name: "x" });
    expect(reports).toHaveLength(0);
  });
});

describe("ESLint plugin via RuleTester", () => {
  it("no-raw-style: flags any element carrying a style prop regardless of component or HTML", () => {
    ruleTester.run("no-raw-style", eslintPlugin.rules["no-raw-style"]!, {
      valid: [
        { code: "<div>x</div>" },
        { code: "<Box p={4}>x</Box>" },
        { code: "<div {...props}>x</div>" },
      ],
      invalid: [
        {
          code: "<div style={{}}>x</div>",
          errors: [{ message: "<div> uses raw style prop — use vDsl token props instead" }],
        },
        {
          code: "<Box style={{ padding: 8 }}>x</Box>",
          errors: [{ message: "<Box> uses raw style prop — use vDsl token props instead" }],
        },
        {
          code: "<div style={myStyles}>x</div>",
          errors: [{ message: "<div> uses raw style prop — use vDsl token props instead" }],
        },
      ],
    });
  });

  it("no-raw-classname: flags className on HTML elements; passes on components and elements without it", () => {
    ruleTester.run("no-raw-classname", eslintPlugin.rules["no-raw-classname"]!, {
      valid: [
        { code: "<Box className=\"p-4\">x</Box>" },
        { code: "<div>x</div>" },
        { code: "<div id=\"root\">x</div>" },
      ],
      invalid: [
        {
          code: "<div className=\"p-4\">x</div>",
          errors: [{ message: "<div> uses className — replace with a vDsl component" }],
        },
        {
          code: "<span className=\"text-sm\">x</span>",
          errors: [{ message: "<span> uses className — replace with a vDsl component" }],
        },
        {
          code: "<div className={\"p-4\"}>x</div>",
          errors: [{ message: "<div> uses className — replace with a vDsl component" }],
        },
      ],
    });
  });

  it("valid-token-values: flags values outside scale for both numeric expression and string forms", () => {
    ruleTester.run("valid-token-values", eslintPlugin.rules["valid-token-values"]!, {
      valid: [
        { code: "<Box p={4}>x</Box>" },
        { code: "<Box m={8}>x</Box>" },
        { code: "<Box p=\"4\">x</Box>" },
        { code: "<Box>x</Box>" },
      ],
      invalid: [
        {
          code: "<Box p={5}>x</Box>",
          errors: [{ message: "<Box> prop \"p={5}\" is not in the declared token scale" }],
        },
        {
          code: "<Box p=\"5\">x</Box>",
          errors: [{ message: "<Box> prop \"p={5}\" is not in the declared token scale" }],
        },
        {
          code: "<Box p={5} m={5}>x</Box>",
          errors: [
            { message: "<Box> prop \"p={5}\" is not in the declared token scale" },
            { message: "<Box> prop \"m={5}\" is not in the declared token scale" },
          ],
        },
      ],
    });
  });

  it("no-arbitrary-class: flags arbitrary Tailwind class values read via Literal→StringLiteral translation", () => {
    ruleTester.run("no-arbitrary-class", eslintPlugin.rules["no-arbitrary-class"]!, {
      valid: [
        { code: "<Box className=\"p-4 text-sm flex\">x</Box>" },
        { code: "<Box className=\"\">x</Box>" },
        { code: "<Box>x</Box>" },
      ],
      invalid: [
        {
          code: "<Box className=\"bg-[#fff]\">x</Box>",
          errors: [{ message: "<Box> className contains arbitrary value(s): bg-[#fff]" }],
        },
        {
          code: "<div className=\"w-[200px] h-[100px]\">x</div>",
          errors: [{ message: "<div> className contains arbitrary value(s): w-[200px], h-[100px]" }],
        },
        {
          code: "<Box className=\"flex bg-[red] p-4\">x</Box>",
          errors: [{ message: "<Box> className contains arbitrary value(s): bg-[red]" }],
        },
      ],
    });
  });

  it("consistent-as-prop: flags HTML tag in as prop via both bare and expression-container string forms", () => {
    ruleTester.run("consistent-as-prop", eslintPlugin.rules["consistent-as-prop"]!, {
      valid: [
        { code: "<Box>x</Box>" },
        { code: "<Box as=\"Button\">x</Box>" },
        { code: "<Box as={TextComponent}>x</Box>" },
        { code: "<div as=\"div\">x</div>" },
      ],
      invalid: [
        {
          code: "<Box as=\"div\">x</Box>",
          errors: [
            { message: "<Box as=\"div\"> renders as a raw HTML element — use the corresponding vDsl component directly" },
          ],
        },
        {
          code: "<Box as={\"div\"}>x</Box>",
          errors: [
            { message: "<Box as=\"div\"> renders as a raw HTML element — use the corresponding vDsl component directly" },
          ],
        },
        {
          code: "<Card as=\"button\">x</Card>",
          errors: [
            { message: "<Card as=\"button\"> renders as a raw HTML element — use the corresponding vDsl component directly" },
          ],
        },
      ],
    });
  });
});
