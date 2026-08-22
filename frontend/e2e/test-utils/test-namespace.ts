/**
 * Generate a unique test namespace name based on the current timestamp.
 * Format: test-{base36 timestamp} — unique across runs, no collision risk.
 */
export function generateTestNamespace(): string {
  return `test-${Date.now().toString(36)}`;
}