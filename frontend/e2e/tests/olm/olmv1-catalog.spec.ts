import { test, expect } from '../../fixtures';

test.describe('OLMv1 Software Catalog', { tag: ['@admin', '@tech-preview'] }, () => {
  test('Software Catalog page is accessible on TechPreview clusters', async ({
    page,
    techPreviewOnly,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/k8s\/cluster\/clusterserviceversions|\/software-catalog/, {
      timeout: 30_000,
    });
  });
});
