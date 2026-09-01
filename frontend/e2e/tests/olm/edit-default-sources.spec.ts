import { test, expect } from '../../fixtures';
import { OperatorHubDetailsPage } from '../../pages/operator-hub-details-page';

test.describe('OperatorHub default sources management', { tag: ['@admin'] }, () => {
  let originalSources: Array<{ name?: string; disabled?: boolean }> | null = null;

  test.beforeEach(async ({ k8sClient }) => {
    const operatorHub = (await k8sClient.getClusterCustomResource(
      'config.openshift.io',
      'v1',
      'operatorhubs',
      'cluster',
    )) as {
      spec?: {
        sources?: Array<{ name?: string; disabled?: boolean }>;
      };
    };

    originalSources = operatorHub.spec?.sources
      ? JSON.parse(JSON.stringify(operatorHub.spec.sources))
      : null;
  });

  test.afterEach(async ({ k8sClient }) => {
    await k8sClient.patchClusterCustomResource(
      'config.openshift.io',
      'v1',
      'operatorhubs',
      'cluster',
      { spec: { sources: originalSources } },
    );
  });

  test('disables and re-enables default catalog sources from OperatorHub details page', async ({
    page,
  }) => {
    const operatorHubPage = new OperatorHubDetailsPage(page);
    const defaultSourceToBeToggled = 'redhat-operators';

    await test.step('Navigate to OperatorHub page', async () => {
      await operatorHubPage.navigateToOperatorHub();
    });

    await test.step('Verify OperatorHub details page is open', async () => {
      await operatorHubPage.verifySectionHeading('OperatorHub details');
    });

    await test.step('Toggle default source and verify status changes', async () => {
      await operatorHubPage.toggleSourceAndVerify(
        defaultSourceToBeToggled,
        'Disabled',
        'Enabled',
      );
      await expect(operatorHubPage.getSourceStatus(defaultSourceToBeToggled)).toHaveText('Enabled');
    });
  });
});