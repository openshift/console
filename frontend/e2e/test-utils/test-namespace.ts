/**
 * Generate a randomized test namespace name
 * Format: test-{5 random lowercase letters}
 */
export function generateTestNamespace(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `test-${suffix}`;
}