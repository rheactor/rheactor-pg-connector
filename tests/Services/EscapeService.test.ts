import { describe, expect, it } from "vitest";

import { escapeIdentifier } from "#/Services/EscapeService";

describe("EscapeService", () => {
  type Test = [input: string, output: string];

  const tests: Test[] = [
    ["", '""'],
    ['"', '""""'],
    ['"a"', '"""a"""'],
    ["'", '"\'"'],
  ];

  it.each(tests)("escapeIdentifier(%j)", (input, output) => {
    expect(escapeIdentifier(input)).toBe(output);
  });
});
