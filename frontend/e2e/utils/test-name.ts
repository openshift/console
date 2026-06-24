export function generateTestName(): string {
  return `test${Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substring(0, 5)}`;
}
