import { test, expect } from '../../fixtures';
import type { LifecycleData } from '../../mocks/operator-lifecycle';
import {
  makeLifecycleActiveAndCompatible,
  makeLifecycleSelfSupport,
  makeLifecycleIncompatible,
} from '../../mocks/operator-lifecycle';
import { InstalledOperatorsPage } from '../../pages/installed-operators-page';

const OLM_GROUP = 'operators.coreos.com';
const OLM_VERSION = 'v1alpha1';
const OPERATOR_NAMESPACE = 'openshift-operators';
const PACKAGE_NAME = 'web-terminal';
const CSV_NAME_PREFIX = `${PACKAGE_NAME}.v`;
const CATALOG_SOURCE = 'redhat-operators';
const CATALOG_NAMESPACE = 'openshift-marketplace';
const LIFECYCLE_URL_PATTERN = '**/api/olm/lifecycle/**';

const INSTALL_TIMEOUT = 300_000;
const POLL_INTERVAL = 10_000;

type CSVResource = {
  metadata?: { name?: string };
  spec?: { version?: string; displayName?: string };
  status?: { phase?: string };
};

const webTerminalSubscription = {
  apiVersion: `${OLM_GROUP}/${OLM_VERSION}`,
  kind: 'Subscription',
  metadata: {
    name: PACKAGE_NAME,
    namespace: OPERATOR_NAMESPACE,
  },
  spec: {
    channel: 'fast',
    name: PACKAGE_NAME,
    source: CATALOG_SOURCE,
    sourceNamespace: CATALOG_NAMESPACE,
    installPlanApproval: 'Automatic',
  },
};

test.describe('Operator lifecycle metadata', { tag: ['@admin'] }, () => {
  let operatorVersion: string;
  let operatorDisplayName: string;

  test.beforeAll(async ({ k8sClient }) => {
    test.setTimeout(INSTALL_TIMEOUT + 60_000);

    try {
      await k8sClient.createCustomResource(
        OLM_GROUP,
        OLM_VERSION,
        OPERATOR_NAMESPACE,
        'subscriptions',
        webTerminalSubscription,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('409') && !msg.includes('already exists')) {
        throw err;
      }
    }

    const deadline = Date.now() + INSTALL_TIMEOUT;
    let csv: CSVResource | undefined;
    while (Date.now() < deadline) {
      try {
        const sub = (await k8sClient.getCustomResource(
          OLM_GROUP,
          OLM_VERSION,
          OPERATOR_NAMESPACE,
          'subscriptions',
          PACKAGE_NAME,
        )) as { status?: { installedCSV?: string } };

        const csvName = sub?.status?.installedCSV;
        if (csvName) {
          const csvResource = (await k8sClient.getCustomResource(
            OLM_GROUP,
            OLM_VERSION,
            OPERATOR_NAMESPACE,
            'clusterserviceversions',
            csvName,
          )) as CSVResource;

          if (csvResource?.status?.phase === 'Succeeded') {
            csv = csvResource;
            break;
          }
        }
      } catch {
        // subscription or CSV not ready yet
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }

    if (!csv) {
      throw new Error(
        `Timed out waiting for ${PACKAGE_NAME} CSV to reach Succeeded phase`,
      );
    }

    operatorVersion = csv.spec?.version ?? '';
    operatorDisplayName = csv.spec?.displayName ?? PACKAGE_NAME;
  });

  test.afterAll(async ({ k8sClient }) => {
    const csvs = (await k8sClient.listCustomResources(
      OLM_GROUP,
      OLM_VERSION,
      OPERATOR_NAMESPACE,
      'clusterserviceversions',
    )) as CSVResource[];

    await Promise.allSettled([
      k8sClient.deleteCustomResource(
        OLM_GROUP,
        OLM_VERSION,
        OPERATOR_NAMESPACE,
        'subscriptions',
        PACKAGE_NAME,
      ),
      ...csvs
        .filter((c) => c.metadata?.name?.startsWith(CSV_NAME_PREFIX))
        .map((c) =>
          k8sClient.deleteCustomResource(
            OLM_GROUP,
            OLM_VERSION,
            OPERATOR_NAMESPACE,
            'clusterserviceversions',
            c.metadata!.name!,
          ),
        ),
    ]);
  });

  test('displays lifecycle metadata columns for installed operator', async ({ page }) => {
    let activeLifecycleData: LifecycleData | null = null;

    await page.route(LIFECYCLE_URL_PATTERN, async (route) => {
      if (activeLifecycleData) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(activeLifecycleData),
        });
      } else {
        await route.abort();
      }
    });

    const installedOperators = new InstalledOperatorsPage(page);
    await installedOperators.navigateTo(OPERATOR_NAMESPACE);

    const serverFlags = await page.evaluate(() => window.SERVER_FLAGS);
    test.skip(
      !serverFlags.olmLifecycleMetadata,
      'Lifecycle metadata columns require the OLMLifecycleAndCompatibility feature gate',
    );
    const releaseVersion = serverFlags.releaseVersion ?? '';
    const versionMatch = releaseVersion.match(/^(\d+\.\d+)/);
    const clusterMinorVersion = versionMatch ? versionMatch[1] : '4.18';

    await test.step('Active support phase and compatible cluster', async () => {
      activeLifecycleData = makeLifecycleActiveAndCompatible(
        PACKAGE_NAME,
        operatorVersion,
        clusterMinorVersion,
      );

      await page.reload();
      await expect(
        installedOperators.getOperatorRow(operatorDisplayName),
      ).toBeVisible({ timeout: 30_000 });

      await expect(
        installedOperators.getCompatibleIndicator(operatorDisplayName),
      ).toContainText('Compatible', { timeout: 30_000 });

      await expect(
        installedOperators.getSupportPhaseBadge(operatorDisplayName),
      ).toContainText('Maintenance support');
    });

    await test.step('Unsupported when all phases expired', async () => {
      activeLifecycleData = makeLifecycleSelfSupport(
        PACKAGE_NAME,
        operatorVersion,
        clusterMinorVersion,
      );

      await page.reload();
      await expect(
        installedOperators.getOperatorRow(operatorDisplayName),
      ).toBeVisible({ timeout: 30_000 });

      await expect(
        installedOperators.getSelfSupportBadge(operatorDisplayName),
      ).toContainText('Unsupported', { timeout: 30_000 });
    });

    await test.step('Incompatible when cluster version not in compatibility list', async () => {
      activeLifecycleData = makeLifecycleIncompatible(PACKAGE_NAME, operatorVersion);

      await page.reload();
      await expect(
        installedOperators.getOperatorRow(operatorDisplayName),
      ).toBeVisible({ timeout: 30_000 });

      await expect(
        installedOperators.getIncompatibleIndicator(operatorDisplayName),
      ).toContainText('Incompatible', { timeout: 30_000 });
    });
  });
});
