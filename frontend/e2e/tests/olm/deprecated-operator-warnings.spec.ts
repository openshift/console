import * as path from 'path';

import type { Browser } from '@playwright/test';

import { test, expect } from '../../fixtures';
import { gotoAuthenticated } from '../../pages/base-page';
import { CatalogPage } from '../../pages/catalog-page';
import { DetailsPage } from '../../pages/details-page';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';
import { OperatorInstallPage } from '../../pages/operator-install-page';
import { generateTestNamespace } from '../../test-utils/test-namespace';

const BASE_URL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';
const ADMIN_STORAGE_STATE = path.resolve(import.meta.dirname, '..', '..', '.auth', 'kubeadmin.json');
const CATALOG_SOURCE_NAMESPACE = 'openshift-marketplace';
const OPERATOR_DETAILS_NAMESPACE = 'default';
const INSTALLED_OPERATOR_NAME = 'Kiali Operator';
const DEPRECATED_BADGE = 'Deprecated';
const DEPRECATED_PACKAGE_MESSAGE = 'package kiali is end of life';
const DEPRECATED_CHANNEL_MESSAGE = 'channel alpha is no longer supported';
const DEPRECATED_VERSION = 'kiali-operator.v1.68.0';
const DEPRECATED_VERSION_MESSAGE = `${DEPRECATED_VERSION} is deprecated`;
const LATEST_VERSION = '1.83.0';
const LATEST_VERSION_OPTION = 'kiali-operator.v1.83.0';
const TECH_PREVIEW_SKIP_REASON =
  'OLMv1 is active on techPreview clusters — OLMv0 OperatorHub catalog is unavailable';
const SETUP_TIMEOUT = 360_000;
const DEFAULT_DEPRECATED_OPERATOR_CATALOG_IMAGE =
  'quay.io/cajieh0/deprecation-catalog@sha256:0d49292bd51c36644aa703f18f777780af6bffd8748aa8f594111bde9639bcaa';
const DEPRECATED_OPERATOR_CATALOG_IMAGE =
  process.env.DEPRECATED_OPERATOR_CATALOG_IMAGE ?? DEFAULT_DEPRECATED_OPERATOR_CATALOG_IMAGE;
const CATALOG_SOURCE_DISPLAY_NAME = 'Community Operators for testing deprecation';

const runId = generateTestNamespace().replace('test-', '');
const catalogSourceName = `test-community-operator-deprecation-${runId}`;
const subscriptionName = `kiali-${runId}`;
const subscriptionNamespace = generateTestNamespace();
const selectedOperatorId = `kiali-${catalogSourceName}-${CATALOG_SOURCE_NAMESPACE}`;

let isTechPreview = false;
let installedCsvName = DEPRECATED_VERSION;

function buildDeprecatedCatalogSource() {
  return {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'CatalogSource',
    metadata: {
      name: catalogSourceName,
      namespace: CATALOG_SOURCE_NAMESPACE,
    },
    spec: {
      displayName: CATALOG_SOURCE_DISPLAY_NAME,
      image: DEPRECATED_OPERATOR_CATALOG_IMAGE,
      publisher: 'OLM community',
      sourceType: 'grpc',
      updateStrategy: {
        registryPoll: {
          interval: '10m',
        },
      },
    },
  };
}

function buildDeprecatedSubscription() {
  return {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'Subscription',
    metadata: {
      name: subscriptionName,
      namespace: subscriptionNamespace,
    },
    spec: {
      source: catalogSourceName,
      sourceNamespace: CATALOG_SOURCE_NAMESPACE,
      name: 'kiali',
      startingCSV: DEPRECATED_VERSION,
      channel: 'alpha',
      installPlanApproval: 'Manual',
    },
  };
}

function getOperatorDetailsUrl(channel = 'stable', version = LATEST_VERSION): string {
  return `/catalog/ns/${OPERATOR_DETAILS_NAMESPACE}?catalogType=operator&keyword=kia&selectedId=${selectedOperatorId}&channel=${channel}&version=${version}`;
}

function getInstallPageUrl(): string {
  return `/operatorhub/subscribe?pkg=kiali&catalog=${catalogSourceName}&catalogNamespace=${CATALOG_SOURCE_NAMESPACE}&targetNamespace=undefined&channel=alpha&version=1.68.0`;
}

async function detectTechPreview(browser: Browser): Promise<boolean> {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: ADMIN_STORAGE_STATE,
  });

  try {
    const page = await context.newPage();
    await gotoAuthenticated(page, BASE_URL);
    return await page.evaluate(() => Boolean(window.SERVER_FLAGS?.techPreview));
  } finally {
    await context.close();
  }
}

async function expectDeprecatedWarning(
  catalogPage: CatalogPage,
  testId: string,
  text: string,
): Promise<void> {
  await expect(catalogPage.getDeprecatedWarning(testId)).toContainText(text, { timeout: 60_000 });
}

test.describe('Deprecated operator warnings', { tag: ['@admin'] }, () => {
  test.describe.configure({ timeout: SETUP_TIMEOUT });

  test.beforeAll(async ({ browser, k8sClient }) => {
    test.setTimeout(SETUP_TIMEOUT);

    isTechPreview = await detectTechPreview(browser);
    if (isTechPreview) {
      return;
    }

    await k8sClient.createCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      CATALOG_SOURCE_NAMESPACE,
      'catalogsources',
      buildDeprecatedCatalogSource(),
    );

    await expect(async () => {
      const catalogSource = (await k8sClient.getCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        CATALOG_SOURCE_NAMESPACE,
        'catalogsources',
        catalogSourceName,
      )) as { status?: { connectionState?: { lastObservedState?: string } } };

      expect(catalogSource.status?.connectionState?.lastObservedState).toBe('READY');
    }).toPass({ timeout: 300_000, intervals: [5_000] });

    await expect(async () => {
      const manifests = (await k8sClient.listCustomResources(
        'packages.operators.coreos.com',
        'v1',
        OPERATOR_DETAILS_NAMESPACE,
        'packagemanifests',
      )) as Array<{ status?: { catalogSource?: string } }>;
      expect(manifests.some((manifest) => manifest.status?.catalogSource === catalogSourceName)).toBe(
        true,
      );
    }).toPass({ timeout: 180_000, intervals: [5_000] });
  });

  test.afterAll(async ({ k8sClient }) => {
    if (isTechPreview) {
      return;
    }

    try {
      const [subscriptionCleanup, namespaceCleanup] = await Promise.allSettled([
        k8sClient.deleteCustomResource(
          'operators.coreos.com',
          'v1alpha1',
          subscriptionNamespace,
          'subscriptions',
          subscriptionName,
        ),
        k8sClient.deleteNamespace(subscriptionNamespace),
      ]);

      if (namespaceCleanup.status === 'rejected') {
        throw namespaceCleanup.reason;
      }

      if (subscriptionCleanup.status === 'rejected') {
        throw subscriptionCleanup.reason;
      }
    } finally {
      await k8sClient.deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        CATALOG_SOURCE_NAMESPACE,
        'catalogsources',
        catalogSourceName,
      );
    }
  });

  test('displays deprecated badge on operator tile in catalog', async ({ page }) => {
    test.skip(isTechPreview, TECH_PREVIEW_SKIP_REASON);

    const catalogPage = new CatalogPage(page);

    await catalogPage.navigateToSoftwareCatalog(OPERATOR_DETAILS_NAMESPACE);
    await catalogPage.clickOperatorTab();
    await expect(catalogPage.getCatalogTiles().first()).toBeVisible({ timeout: 60_000 });

    await catalogPage.toggleSourceFilterByLabel(CATALOG_SOURCE_DISPLAY_NAME);

    await catalogPage.searchOperators('kiali');
    const firstTile = catalogPage.getCatalogTiles().first();
    await expect(firstTile).toBeVisible({ timeout: 60_000 });
    await expect(firstTile).toContainText(/kiali/i);
    await expect(firstTile.getByTestId('Deprecated-badge')).toContainText(DEPRECATED_BADGE);
  });

  test('displays package deprecation warnings in operator details', async ({ page }) => {
    test.skip(isTechPreview, TECH_PREVIEW_SKIP_REASON);

    const catalogPage = new CatalogPage(page);
    await catalogPage.navigateToPath(getOperatorDetailsUrl());
    await expect(catalogPage.getCatalogDeprecatedBadge()).toContainText(DEPRECATED_BADGE, {
      timeout: 60_000,
    });
    await expectDeprecatedWarning(
      catalogPage,
      'deprecated-operator-warning-package',
      DEPRECATED_PACKAGE_MESSAGE,
    );
  });

  test('displays channel deprecation warnings when selecting channel', async ({ page }) => {
    test.skip(isTechPreview, TECH_PREVIEW_SKIP_REASON);

    const catalogPage = new CatalogPage(page);
    const installPage = new OperatorInstallPage(page);
    await catalogPage.navigateToPath(getOperatorDetailsUrl());

    await installPage.getChannelSelect().click();
    await expect(installPage.getDeprecatedWarningIcon('channel')).toBeVisible({
      timeout: 30_000,
    });
    await installPage.getChannelOption('alpha').click();

    await expectDeprecatedWarning(
      catalogPage,
      'deprecated-operator-warning-channel',
      DEPRECATED_CHANNEL_MESSAGE,
    );
  });

  test('displays version deprecation warnings when selecting version', async ({ page }) => {
    test.skip(isTechPreview, TECH_PREVIEW_SKIP_REASON);

    const catalogPage = new CatalogPage(page);
    const installPage = new OperatorInstallPage(page);
    await catalogPage.navigateToPath(getOperatorDetailsUrl());

    await installPage.getVersionSelect().click();
    await expect(installPage.getDeprecatedWarningIcon('version')).toBeVisible({
      timeout: 30_000,
    });
    await installPage.getVersionOption(DEPRECATED_VERSION).click();

    await expectDeprecatedWarning(
      catalogPage,
      'deprecated-operator-warning-version',
      DEPRECATED_VERSION_MESSAGE,
    );
  });

  test('displays all deprecation warnings on install page', async ({ page }) => {
    test.skip(isTechPreview, TECH_PREVIEW_SKIP_REASON);

    const catalogPage = new CatalogPage(page);
    await catalogPage.navigateToPath(getInstallPageUrl());
    await expect(catalogPage.getCatalogDeprecatedBadge()).toContainText(DEPRECATED_BADGE, {
      timeout: 60_000,
    });
    await expectDeprecatedWarning(
      catalogPage,
      'deprecated-operator-warning-package',
      DEPRECATED_PACKAGE_MESSAGE,
    );
    await expectDeprecatedWarning(
      catalogPage,
      'deprecated-operator-warning-channel',
      DEPRECATED_CHANNEL_MESSAGE,
    );
    await expectDeprecatedWarning(
      catalogPage,
      'deprecated-operator-warning-version',
      DEPRECATED_VERSION_MESSAGE,
    );
  });

  test.describe('Installed Operator deprecation warnings', () => {
    test.beforeAll(async ({ k8sClient }) => {
      test.setTimeout(SETUP_TIMEOUT);

      if (isTechPreview) {
        return;
      }

      await k8sClient.createNamespace(subscriptionNamespace);
      await k8sClient.createCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'subscriptions',
        buildDeprecatedSubscription(),
      );

      await expect(async () => {
        const subscription = (await k8sClient.getCustomResource(
          'operators.coreos.com',
          'v1alpha1',
          subscriptionNamespace,
          'subscriptions',
          subscriptionName,
        )) as {
          status?: {
            installPlanRef?: { name?: string };
          };
        };

        expect(subscription.status?.installPlanRef?.name).toBeTruthy();
      }).toPass({ timeout: 120_000, intervals: [5_000] });

      const subscription = (await k8sClient.getCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'subscriptions',
        subscriptionName,
      )) as {
        status?: {
          installPlanRef?: { name?: string };
          installedCSV?: string;
        };
      };

      const installPlanName = subscription.status?.installPlanRef?.name;

      if (!installPlanName) {
        throw new Error(`InstallPlan ref not found for subscription ${subscriptionName}`);
      }

      await k8sClient.patchCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'installplans',
        installPlanName,
        [{ op: 'replace', path: '/spec/approved', value: true }],
      );

      await expect(async () => {
        const approvedSubscription = (await k8sClient.getCustomResource(
          'operators.coreos.com',
          'v1alpha1',
          subscriptionNamespace,
          'subscriptions',
          subscriptionName,
        )) as {
          status?: {
            installedCSV?: string;
          };
        };

        expect(approvedSubscription.status?.installedCSV).toBeTruthy();
      }).toPass({ timeout: 180_000, intervals: [5_000] });

      const installedSubscription = (await k8sClient.getCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        subscriptionNamespace,
        'subscriptions',
        subscriptionName,
      )) as {
        status?: {
          installedCSV?: string;
        };
      };

      const nextInstalledCsvName = installedSubscription.status?.installedCSV;
      if (!nextInstalledCsvName) {
        throw new Error(`Installed CSV not found for subscription ${subscriptionName}`);
      }
      installedCsvName = nextInstalledCsvName;

      await expect(async () => {
        const csv = (await k8sClient.getCustomResource(
          'operators.coreos.com',
          'v1alpha1',
          subscriptionNamespace,
          'clusterserviceversions',
          installedCsvName,
        )) as { status?: { phase?: string } };
        expect(csv.status?.phase).toBe('Succeeded');
      }).toPass({ timeout: 300_000, intervals: [5_000] });

      await expect(async () => {
        const currentSubscription = (await k8sClient.getCustomResource(
          'operators.coreos.com',
          'v1alpha1',
          subscriptionNamespace,
          'subscriptions',
          subscriptionName,
        )) as {
          status?: {
            conditions?: Array<{ type?: string }>;
          };
        };

        const hasDeprecatedCondition = currentSubscription.status?.conditions?.some(
          (condition) => condition.type === 'PackageDeprecated',
        );
        expect(hasDeprecatedCondition).toBe(true);
      }).toPass({ timeout: 180_000, intervals: [5_000] });
    });

    test('displays deprecated badge on installed operators list', async ({ page }) => {
      test.skip(isTechPreview, TECH_PREVIEW_SKIP_REASON);

      const installedOperatorsPage = new InstalledOperatorsPage(page);
      await installedOperatorsPage.navigateTo(subscriptionNamespace);
      await installedOperatorsPage.filterByName(INSTALLED_OPERATOR_NAME);

      const operatorRow = installedOperatorsPage.getOperatorRow(INSTALLED_OPERATOR_NAME);
      await expect(operatorRow).toBeVisible({ timeout: 60_000 });
      await expect(operatorRow.getByTestId('deprecated-operator-warning-badge')).toContainText(
        DEPRECATED_BADGE,
      );
    });

    test('displays deprecation warnings on CSV details page', async ({ page }) => {
      test.skip(isTechPreview, TECH_PREVIEW_SKIP_REASON);

      const catalogPage = new CatalogPage(page);
      const detailsPage = new DetailsPage(page);
      await detailsPage.navigateToDetailsPage(
        `/k8s/ns/${subscriptionNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${installedCsvName}`,
      );

      await expect(detailsPage.tab('Details')).toBeVisible({ timeout: 60_000 });
      await expect(catalogPage.getDeprecatedWarningBadge()).toContainText(DEPRECATED_BADGE, {
        timeout: 60_000,
      });
      await expectDeprecatedWarning(
        catalogPage,
        'deprecated-operator-warning-package',
        DEPRECATED_PACKAGE_MESSAGE,
      );
      await expectDeprecatedWarning(
        catalogPage,
        'deprecated-operator-warning-channel',
        DEPRECATED_CHANNEL_MESSAGE,
      );
      await expectDeprecatedWarning(
        catalogPage,
        'deprecated-operator-warning-version',
        DEPRECATED_VERSION_MESSAGE,
      );
    });

    test('displays deprecation warnings on CSV subscription tab', async ({ page }) => {
      test.skip(isTechPreview, TECH_PREVIEW_SKIP_REASON);

      const catalogPage = new CatalogPage(page);
      const detailsPage = new DetailsPage(page);
      await detailsPage.navigateToDetailsPage(
        `/k8s/ns/${subscriptionNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${installedCsvName}/subscription`,
      );

      await expect(detailsPage.tab('Subscription')).toBeVisible({
        timeout: 60_000,
      });
      await expectDeprecatedWarning(
        catalogPage,
        'deprecated-operator-warning-package',
        DEPRECATED_PACKAGE_MESSAGE,
      );
      await expectDeprecatedWarning(
        catalogPage,
        'deprecated-operator-warning-channel',
        DEPRECATED_CHANNEL_MESSAGE,
      );
      await expectDeprecatedWarning(
        catalogPage,
        'deprecated-operator-warning-version',
        DEPRECATED_VERSION_MESSAGE,
      );
      await expect(catalogPage.getDeprecatedWarning('deprecated-operator-warning-subscription-update-icon')).toBeVisible({
        timeout: 30_000,
      });

      const updateButton = page.getByTestId('subscription-channel-update-button');
      await expect(updateButton).toBeEnabled({ timeout: 30_000 });
      await updateButton.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId(LATEST_VERSION_OPTION)).toBeVisible({ timeout: 30_000 });
    });
  });
});
