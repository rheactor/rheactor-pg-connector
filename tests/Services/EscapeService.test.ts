import { describe, expect, it } from "vitest";

import { escapeIdentifier, escapeLiteral } from "#/Services/EscapeService";

describe("EscapeService", () => {
  type EscapeIdentifierTest = [input: string, output: string];

  const escapeIdentifierTests: EscapeIdentifierTest[] = [
    ["", '""'],
    ['"', '""""'],
    ['"a"', '"""a"""'],
    ["'", '"\'"'],
  ];

  it.each(escapeIdentifierTests)("escapeIdentifier(%j)", (input, output) => {
    expect(escapeIdentifier(input)).toBe(output);
  });

  type EscapeLiteralTest = [input: string | undefined, output: string];

  const escapeLiteralTests: EscapeLiteralTest[] = [
    [undefined, "''"],
    ["", "''"],
    ["a", "'a'"],
    ["'", "''''"],
    ["a'b", "'a''b'"],
    ["a''b", "'a''''b'"],
    ["\\", ` E'\\\\'`],
    [`a\\b`, ` E'a\\\\b'`],
    [`a\\'b`, ` E'a\\\\''b'`],
    ["\n", "'\n'"],
    ["\t", "'\t'"],
  ];

  it.each(escapeLiteralTests)("escapeLiteral(%j)", (input, output) => {
    expect(escapeLiteral(input)).toBe(output);
  });

  it("escapeLiteral() throws on null byte", () => {
    expect(() => escapeLiteral("a\0b")).toThrow("literal cannot contain null bytes");
  });
});
