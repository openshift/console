import { test, expect } from '../../fixtures';
import { OperatorHubDetailsPage } from '../../pages/operator-hub-details-page';

test.describe('OperatorHub default sources management', { tag: ['@admin'] }, () => {
  test.afterEach(async ({ k8sClient }) => {
    // Ensure redhat-operators source is always enabled after test
    try {
      await k8sClient.patchClusterCustomResource(
        'config.openshift.io',
        'v1',
        'operatorhubs',
        'cluster',
        [{ op: 'replace', path: '/spec/sources/0/disabled', value: false }]
      );
      // Successfully re-enabled redhat-operators source
    } catch (error) {
      // Failed to re-enable redhat-operators source
    }
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
      // First toggle - disable the source
      await operatorHubPage.openEditDefaultSourcesModal();
      await expect(operatorHubPage.getModal().getModalTitle()).toContainText('Edit default sources');
      await operatorHubPage.toggleDefaultSource(defaultSourceToBeToggled);
      await operatorHubPage.submitModal();

      // Verify status change to Disabled
      await expect(operatorHubPage.getSourceStatus(defaultSourceToBeToggled)).toHaveText('Disabled');

      // Second toggle - re-enable the source
      await operatorHubPage.openEditDefaultSourcesModal();
      await expect(operatorHubPage.getModal().getModalTitle()).toContainText('Edit default sources');
      await operatorHubPage.toggleDefaultSource(defaultSourceToBeToggled);
      await operatorHubPage.submitModal();

      // Verify status change back to Enabled
      await expect(operatorHubPage.getSourceStatus(defaultSourceToBeToggled)).toHaveText('Enabled');
    });
  });
});