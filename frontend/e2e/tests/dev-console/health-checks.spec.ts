import { test } from '../../fixtures';

test.describe('Health Checks', { tag: ['@dev-console', '@smoke'] }, () => {
  // eslint-disable-next-line playwright/expect-expect
  test('adds health checks from Import from Git form', async () => {
    test.skip(true, 'Requires Import from Git flow — not yet implemented');
  });
});
