export function escapeIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function escapeLiteral(value: unknown) {
  if (typeof value !== "string") {
    return "''";
  }

  if (value.includes("\0")) {
    throw new Error("literal cannot contain null bytes");
  }

  return value.includes("\\")
    ? ` E'${value.replaceAll("'", "''").replaceAll("\\", `\\\\`)}'`
    : `'${value.replaceAll("'", "''")}'`;
}
