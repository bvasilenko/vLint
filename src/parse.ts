
import { parse as babelParse } from "@babel/parser";
import type { File } from "@babel/types";

const PARSER_PLUGINS = [
  "jsx",
  "typescript",
  "importMeta",
  "dynamicImport",
  "nullishCoalescingOperator",
  "optionalChaining",
  "optionalCatchBinding",
  "logicalAssignment",
  "classProperties",
  "classPrivateProperties",
  "classPrivateMethods",
  "exportDefaultFrom",
] as const;

export function parseSource(source: string, filePath: string): File {
  return babelParse(source, {
    sourceType: "module",
    sourceFilename: filePath,
    strictMode: false,
    plugins: [...PARSER_PLUGINS],
  });
}