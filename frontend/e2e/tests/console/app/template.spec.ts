import { test, expect } from '../../../fixtures';
import { CatalogPage } from '../../../pages/catalog-page';

const TEMPLATE_ICON = 'https://example.com/icon/logo.png';

function buildTemplateBody(name: string) {
  return {
    apiVersion: 'template.openshift.io/v1',
    kind: 'Template',
    metadata: {
      name,
      namespace: 'openshift',
      annotations: {
        iconClass: TEMPLATE_ICON,
        'openshift.io/display-name': 'Test Apache HTTP Server',
        description: 'An example Apache HTTP Server Test.',
      },
      labels: {
        'samples.operator.openshift.io/managed': 'true',
      },
    },
    objects: [],
    parameters: [],
  };
}

test.describe('Template feature', { tag: ['@admin'] }, () => {
  test('allows custom icon using template annotation', async ({ page, k8sClient, cleanup }) => {
    const catalogPage = new CatalogPage(page);
    const templateName = `httpd-test-${Date.now()}`;

    await test.step('Create template with custom icon', async () => {
      await k8sClient.createCustomResource(
        'template.openshift.io',
        'v1',
        'openshift',
        'templates',
        buildTemplateBody(templateName),
      );
      cleanup.trackCustomResource(
        templateName,
        'openshift',
        'template.openshift.io',
        'v1',
        'templates',
      );
    });

    await test.step('Navigate to catalog and filter for template', async () => {
      await catalogPage.navigateToCatalog();
      await catalogPage.filterByKeyword('test apache');
    });

    await test.step('Verify template displays custom icon', async () => {
      const item = catalogPage.catalogItem('Template-Test Apache HTTP Server');
      await expect(item).toBeVisible();
      const icon = catalogPage.catalogItemIcon('Template-Test Apache HTTP Server');
      await expect(icon).toHaveAttribute('src', TEMPLATE_ICON);
    });
  });
});
