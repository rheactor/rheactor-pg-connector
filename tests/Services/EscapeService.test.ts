import { describe, expect, it } from "vitest";

import { escapeIdentifier, escapeLiteral } from "#/Services/EscapeService";

describe("EscapeService", () => {
  type Test = [input: string, output: string];

  const escaleIdentifierTests: Test[] = [
    ["", '""'],
    ['"', '""""'],
    ['"a"', '"""a"""'],
    ["'", '"\'"'],
  ];

  it.each(escaleIdentifierTests)("escapeIdentifier(%j)", (input, output) => {
    expect(escapeIdentifier(input)).toBe(output);
  });

  const escaleLiteralTests: Test[] = [
    ["", "''"],
    ["a", "'a'"],
    ["'", "''''"],
    ["a'b", "'a''b'"],
    ["a''b", "'a''''b'"],
    ["\\", " E'\\\\'"],
    ["a\\b", " E'a\\\\b'"],
    ["a\\'b", " E'a\\\\''b'"],
    ["\n", "'\n'"],
    ["\t", "'\t'"],
  ];

  it.each(escaleLiteralTests)("escapeLiteral(%j)", (input, output) => {
    expect(escapeLiteral(input)).toBe(output);
  });

  it("escapeLiteral() throws on null byte", () => {
    expect(() => escapeLiteral("a\0b")).toThrow("literal cannot contain null bytes");
  });
});
