import { test, expect } from '../../fixtures';
import { InstalledOperatorsPage } from '../../pages/olm/installed-operators-page';
import { testDeprecatedCatalogSource, testDeprecatedSubscription } from './mocks';

const TIMEOUT = 300_000;
const testOperatorName = 'Kiali Community Operator';
const testOperator = { name: 'Kiali Operator' };
const deprecatedBadge = 'Deprecated';
const deprecatedPackageMessage = 'package kiali is end of life';
const deprecatedChannelMessage = 'channel alpha is no longer supported';
const deprecatedVersionMessage = 'kiali-operator.v1.68.0 is deprecated';
const DEPRECATED_BADGE_ID = 'deprecated-operator-warning-badge';
const DEPRECATED_PACKAGE_ID = 'deprecated-operator-warning-package';
const DEPRECATED_CHANNEL_ID = 'deprecated-operator-warning-channel';
const DEPRECATED_VERSION_ID = 'deprecated-operator-warning-version';

const subscriptionName = testDeprecatedSubscription.metadata.name;
const subscriptionNamespace = testDeprecatedSubscription.metadata.namespace;
const csvName = testDeprecatedSubscription.spec.startingCSV;
const catalogSourceName = testDeprecatedCatalogSource.metadata.name;
const catalogSourceNamespace = testDeprecatedCatalogSource.metadata.namespace;

test.describe('Deprecated operator warnings', { tag: ['@admin'] }, () => {
  const testNs = `olm-deprecated-${Date.now()}`;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(testNs);
    // Clean up any existing resources from previous failed runs
    await k8sClient
      .deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'subscriptions',
        subscriptionName,
      )
      .catch(() => {});
    await k8sClient
      .deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'clusterserviceversions',
        csvName,
      )
      .catch(() => {});
    await k8sClient
      .deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        catalogSourceNamespace,
        'catalogsources',
        catalogSourceName,
      )
      .catch(() => {});

    await k8sClient.createCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      catalogSourceNamespace,
      'catalogsources',
      testDeprecatedCatalogSource,
    );

    // Wait for CatalogSource to become READY
    const ready = await k8sClient.waitForCustomResourceCondition(
      'operators.coreos.com',
      'v1alpha1',
      catalogSourceNamespace,
      'catalogsources',
      catalogSourceName,
      (cs: any) => cs?.status?.connectionState?.lastObservedState === 'READY',
      TIMEOUT,
    );
    if (!ready) {
      throw new Error(`CatalogSource ${catalogSourceName} did not become READY within timeout`);
    }
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient
      .deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'subscriptions',
        subscriptionName,
      )
      .catch(() => {});
    await k8sClient
      .deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'clusterserviceversions',
        csvName,
      )
      .catch(() => {});

    // Delete InstallPlans related to the operator
    const installPlans = await k8sClient.listCustomResources(
      'operators.coreos.com',
      'v1alpha1',
      subscriptionNamespace,
      'installplans',
    );
    for (const ip of installPlans) {
      const ipName = (ip as any)?.metadata?.name;
      const csvNames: string[] = (ip as any)?.spec?.clusterServiceVersionNames ?? [];
      if (ipName && csvNames.includes(csvName)) {
        await k8sClient
          .deleteCustomResource(
            'operators.coreos.com',
            'v1alpha1',
            subscriptionNamespace,
            'installplans',
            ipName,
          )
          .catch(() => {});
      }
    }

    await k8sClient
      .deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        catalogSourceNamespace,
        'catalogsources',
        catalogSourceName,
      )
      .catch(() => {});

    await k8sClient.deleteNamespace(testNs);
  });

  test('verify deprecated Operator warning badge on the Operator tile', async ({ page }) => {
    await test.step('Verify CatalogSource is READY', async () => {
      await page.goto(
        `/k8s/ns/${catalogSourceNamespace}/operators.coreos.com~v1alpha1~CatalogSource/${catalogSourceName}`,
      );
      await expect(
        page.locator('[data-test-selector="details-item-value__Status"]'),
      ).toHaveText('READY', { timeout: TIMEOUT });
    });

    await test.step('Verify deprecated badge on operator tile', async () => {
      await page.goto(`/catalog/ns/${testNs}`);
      await page.getByTestId('tab operator').click();
      await page.getByTestId('source-community-operators-for-testing-deprecation').click();
      await page.getByTestId('search-catalog').locator('input').fill(testOperatorName);
      await expect(page.locator('.co-catalog-tile')).toHaveCount(1, {
        timeout: TIMEOUT,
      });
      await expect(page.getByTestId('Deprecated-badge')).toContainText(deprecatedBadge);
    });
  });

  test('verify deprecated Operator warnings in the Operator details panel', async ({ page }) => {
    await page.goto(
      `/catalog/ns/${testNs}?catalogType=operator&keyword=kia&selectedId=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0`,
    );
    const detailsPanel = page.getByRole('dialog');
    await expect(detailsPanel.getByTestId('Deprecated-badge')).toContainText(deprecatedBadge);
    await expect(detailsPanel.getByTestId(DEPRECATED_PACKAGE_ID)).toContainText(
      deprecatedPackageMessage,
    );
  });

  test('verify deprecated channel warnings in the Operator details panel', async ({ page }) => {
    await page.goto(
      `/catalog/ns/${testNs}?catalogType=operator&keyword=kia&selectedId=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0`,
    );

    await test.step('Verify channel deprecation warnings do not exist initially', async () => {
      await expect(
        page.getByTestId(DEPRECATED_PACKAGE_ID).locator(`text=${deprecatedChannelMessage}`),
      ).not.toBeAttached();
      await expect(page.getByTestId('deprecated-operator-warning-channel-icon')).not.toBeAttached();
    });

    await test.step('Open channel select and verify deprecation icon', async () => {
      await page.getByTestId('operator-channel-select-toggle').click({ force: true });
      await expect(page.getByTestId('deprecated-operator-warning-channel-icon')).toBeAttached();
    });

    await test.step('Select deprecated channel and verify warning', async () => {
      await page.locator('[data-test="channel-option-alpha"] > button').click({ force: true });
      await expect(page.getByTestId(DEPRECATED_CHANNEL_ID)).toContainText(deprecatedChannelMessage);
    });
  });

  test('verify deprecated version warnings in the Operator details panel', async ({ page }) => {
    await page.goto(
      `/catalog/ns/${testNs}?catalogType=operator&keyword=kia&selectedId=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0`,
    );

    await test.step('Verify version deprecation warnings do not exist initially', async () => {
      await expect(
        page.getByTestId(DEPRECATED_VERSION_ID).locator(`text=${deprecatedVersionMessage}`),
      ).not.toBeAttached();
      await expect(page.getByTestId('deprecated-operator-warning-version-icon')).not.toBeAttached();
    });

    await test.step('Open version select and verify deprecation icon', async () => {
      await page.getByTestId('operator-version-select-toggle').click({ force: true });
      await expect(page.getByTestId('deprecated-operator-warning-version-icon')).toBeAttached();
    });

    await test.step('Select deprecated version and verify warning', async () => {
      await page
        .locator('[data-test="version-option-kiali-operator.v1.68.0"] > button')
        .click({ force: true });
      await expect(page.getByTestId(DEPRECATED_VERSION_ID)).toContainText(deprecatedVersionMessage);
    });
  });

  test('verify deprecated Operator warnings on Install Operator details page', async ({ page }) => {
    await page.goto(
      '/operatorhub/subscribe?pkg=kiali&catalog=test-community-operator-deprecation&catalogNamespace=openshift-marketplace&targetNamespace=undefined&channel=alpha&version=1.68.0',
    );

    await expect(page.getByTestId(DEPRECATED_BADGE_ID)).toContainText(deprecatedBadge);
    await expect(page.getByTestId(DEPRECATED_PACKAGE_ID)).toContainText(deprecatedPackageMessage);
    await expect(page.getByTestId(DEPRECATED_CHANNEL_ID)).toContainText(deprecatedChannelMessage);
    await expect(page.getByTestId(DEPRECATED_VERSION_ID)).toContainText(deprecatedVersionMessage);
  });

  function hasPackageDeprecated(sub: any): boolean {
    const conditions: any[] = sub?.status?.conditions ?? [];
    return conditions.some((c) => c.type === 'PackageDeprecated');
  }

  test.describe('Installed Operator deprecation warnings', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ k8sClient }) => {
      // Install operator via API
      await k8sClient.createCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'subscriptions',
        testDeprecatedSubscription,
      );

      // Wait for InstallPlan to be created
      const hasInstallPlan = await k8sClient.waitForCustomResourceCondition(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'subscriptions',
        subscriptionName,
        (sub: any) => !!sub?.status?.installPlanRef?.name,
        120_000,
      );
      if (!hasInstallPlan) {
        throw new Error('InstallPlan was not created within timeout');
      }

      // Find and approve the InstallPlan
      const installPlans = await k8sClient.listCustomResources(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'installplans',
      );
      for (const ip of installPlans) {
        const csvNames: string[] = (ip as any)?.spec?.clusterServiceVersionNames ?? [];
        if (csvNames.includes(csvName)) {
          const ipName = (ip as any)?.metadata?.name;
          await k8sClient.patchCustomResource(
            'operators.coreos.com',
            'v1alpha1',
            subscriptionNamespace,
            'installplans',
            ipName,
            { spec: { approved: true } },
          );
          break;
        }
      }

      // Wait for CSV to succeed
      const csvReady = await k8sClient.waitForCustomResourceCondition(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'clusterserviceversions',
        csvName,
        (csv: any) => csv?.status?.phase === 'Succeeded',
        TIMEOUT,
      );
      if (!csvReady) {
        throw new Error(`CSV ${csvName} did not reach Succeeded phase within timeout`);
      }

      // Wait for PackageDeprecated condition on subscription
      await k8sClient.waitForCustomResourceCondition(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'subscriptions',
        subscriptionName,
        hasPackageDeprecated,
        180_000,
      );
    });

    test('displays deprecated badge on Installed Operators list page', async ({ page }) => {
      const installedPage = new InstalledOperatorsPage(page);
      await installedPage.navigateTo(subscriptionNamespace);
      await installedPage.filterByName(testOperator.name);
      await expect(installedPage.operatorRow(testOperator.name)).toBeAttached();
      await expect(page.getByTestId(DEPRECATED_BADGE_ID)).toContainText(deprecatedBadge, {
        timeout: TIMEOUT,
      });
    });

    test('displays deprecation warnings on CSV details page', async ({ page }) => {
      await page.goto(
        `/k8s/ns/${subscriptionNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csvName}`,
      );
      await page
        .locator('[data-test-id="horizontal-link-Details"]')
        .waitFor({ state: 'attached', timeout: 60_000 });

      await expect(page.getByTestId(DEPRECATED_BADGE_ID)).toContainText(deprecatedBadge, {
        timeout: TIMEOUT,
      });
      await expect(page.getByTestId(DEPRECATED_PACKAGE_ID)).toContainText(
        deprecatedPackageMessage,
        { timeout: TIMEOUT },
      );
      await expect(page.getByTestId(DEPRECATED_CHANNEL_ID)).toContainText(
        deprecatedChannelMessage,
        { timeout: TIMEOUT },
      );
      await expect(page.getByTestId(DEPRECATED_VERSION_ID)).toContainText(
        deprecatedVersionMessage,
        { timeout: TIMEOUT },
      );
    });

    test('displays deprecation warnings on CSV subscription tab', async ({ page }) => {
      await page.goto(
        `/k8s/ns/${subscriptionNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csvName}/subscription`,
      );
      await page
        .locator('[data-test-id="horizontal-link-Subscription"]')
        .waitFor({ state: 'attached', timeout: 60_000 });

      await expect(page.getByTestId(DEPRECATED_PACKAGE_ID)).toContainText(
        deprecatedPackageMessage,
        { timeout: TIMEOUT },
      );
      await expect(page.getByTestId(DEPRECATED_CHANNEL_ID)).toContainText(
        deprecatedChannelMessage,
        { timeout: TIMEOUT },
      );
      await expect(page.getByTestId(DEPRECATED_VERSION_ID)).toContainText(
        deprecatedVersionMessage,
        { timeout: TIMEOUT },
      );
      await expect(
        page.getByTestId('deprecated-operator-warning-subscription-update-icon'),
      ).toBeAttached({ timeout: TIMEOUT });

      await page.getByTestId('subscription-channel-update-button').click();
      await expect(page.locator('.pf-v6-c-modal-box')).toBeVisible({ timeout: 30_000 });
      await expect(
        page.locator('.pf-v6-c-modal-box').getByTestId('kiali-operator.v1.83.0').first(),
      ).toBeAttached();
    });
  });
});
