import { test, expect } from '../../../fixtures';
import KubernetesClient from '../../../clients/kubernetes-client';
import {
  createCustomResourceViaYaml,
  navigateToCRDInstances,
  updateCustomResourceViaYaml,
} from './crd-test-utils';

const crd = 'ConsoleNotification';

test.describe(`${crd} CRD`, { tag: ['@admin'] }, () => {
  let k8sClient: KubernetesClient;

  test.beforeEach(async ({ k8sClient: client }) => {
    k8sClient = client;
  });

  test(`creates, displays, modifies, and deletes a new ${crd} instance`, async ({ page }) => {
    const name = `console-notification-test-${Date.now()}`;
    const location = 'BannerTop';
    const altLocation = 'BannerBottom';
    const text = `${name} notification that appears ${location}`;
    const altText = `${name} notification that appears ${altLocation}`;

    const crdObj = {
      apiVersion: 'console.openshift.io/v1',
      kind: crd,
      metadata: {
        name,
      },
      spec: {
        location,
        text,
      },
    };

    try {
      await test.step('Navigate to CRD instances page', async () => {
        await navigateToCRDInstances(page, crd);
      });

      await test.step('Create ConsoleNotification instance via YAML editor', async () => {
        await createCustomResourceViaYaml(page, crdObj);
      });

      await test.step('Verify additional printer columns on list page', async () => {
        await page.goto(`/k8s/cluster/console.openshift.io~v1~${crd}`);

        // Verify additional printer column headers
        await expect(page.getByTestId('additional-printer-column-header-Text')).toHaveText('Text');
        await expect(page.getByTestId('additional-printer-column-header-Location')).toHaveText(
          'Location',
        );
        await expect(page.getByTestId('additional-printer-column-header-Age')).toHaveText('Age');

        // Verify additional printer column data for our instance
        const instanceRow = page.getByRole('row', { name: new RegExp(name) });
        await expect(instanceRow.getByTestId('additional-printer-column-data-Text')).toHaveText(
          text,
        );
        await expect(instanceRow.getByTestId('additional-printer-column-data-Location')).toHaveText(
          location,
        );
        await expect(instanceRow.getByTestId('additional-printer-column-data-Age')).toBeVisible();

        // Created column should not exist since Age replaces it
        await expect(page.getByTestId('column-header-Created')).toBeHidden();
      });

      await test.step('Verify additional printer columns on details page', async () => {
        // Navigate to details by clicking the instance link on the list page
        // Using goto can cause a full page reload where model discovery races
        const instanceRow = page.getByRole('row', { name: new RegExp(name) });
        await instanceRow.getByRole('link', { name }).click();
        await expect(page.getByRole('heading', { name })).toBeVisible();

        await expect(page.getByTestId('additional-printer-columns')).toBeVisible();
        await expect(page.locator('[data-test-selector="details-item-label__Text"]')).toHaveText(
          'Text',
        );
        await expect(page.locator('[data-test-selector="details-item-value__Text"]')).toHaveText(
          text,
        );
        await expect(
          page.locator('[data-test-selector="details-item-label__Location"]'),
        ).toHaveText('Location');
        await expect(
          page.locator('[data-test-selector="details-item-value__Location"]'),
        ).toHaveText(location);
        await expect(page.locator('[data-test-selector="details-item-label__Age"]')).toHaveText(
          'Age',
        );
        await expect(page.locator('[data-test-selector="details-item-value__Age"]')).toBeVisible();
      });

      await test.step('Verify notification banner appears', async () => {
        const notification = page.locator(`[data-test="${name}-${location}"]`);
        await expect(notification).toBeVisible();
        await expect(notification).toContainText(text);
      });

      await test.step('Modify ConsoleNotification to change location and text', async () => {
        await page.goto(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}/yaml`);

        await updateCustomResourceViaYaml(page, (obj) => {
          obj.spec.location = altLocation;
          obj.spec.text = altText;
          return obj;
        });
      });

      await test.step('Verify modified notification banner appears', async () => {
        const altNotification = page.locator(`[data-test="${name}-${altLocation}"]`);
        await expect(altNotification).toBeVisible();
        await expect(altNotification).toContainText(altText);
      });

      await test.step('Delete the ConsoleNotification instance', async () => {
        await k8sClient.deleteCustomResource(
          'console.openshift.io',
          'v1',
          '',
          'consolenotifications',
          name,
        );
      });
    } finally {
      try {
        await k8sClient.deleteCustomResource(
          'console.openshift.io',
          'v1',
          '',
          'consolenotifications',
          name,
        );
      } catch (error) {
        // Ignore if already deleted
      }
    }
  });
});
