export function escapeIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}
