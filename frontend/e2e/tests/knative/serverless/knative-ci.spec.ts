import { execFileSync } from 'child_process';

import { test, expect } from '../../../fixtures';
import { AddFlowPage } from '../../../pages/knative/add-flow-page';
import { AdminEventingPage } from '../../../pages/knative/admin-eventing-page';
import { TopologyKnativePage } from '../../../pages/knative/topology-knative-page';
import KubernetesClient from '../../../clients/kubernetes-client';

const SERVICE_NAME = 'kn-service';
const GIT_URL = 'https://github.com/sclorg/nodejs-ex.git';

test.describe(
  'Knative CI smoke tests',
  { tag: ['@smoke', '@regression'] },
  () => {
    test.describe.configure({ mode: 'serial' });

    let k8sClient: KubernetesClient;
    let namespace: string;

    test.beforeAll(async ({ k8sClient: client }) => {
      k8sClient = client;
      namespace = `aut-knative-ci-${Date.now()}`;
      await k8sClient.createNamespace(namespace);
      // OCP 5.0: knative queue-proxy sidecar lacks seccompProfile, relax PodSecurity
      try {
        execFileSync('oc', [
          'label', 'namespace', namespace,
          'pod-security.kubernetes.io/enforce=privileged',
          'pod-security.kubernetes.io/warn=privileged',
          'pod-security.kubernetes.io/audit=privileged',
          'security.openshift.io/scc.podSecurityLabelSync=false',
          '--overwrite',
        ], { encoding: 'utf-8', timeout: 10_000 });
      } catch { /* ignore on OCP 4 */ }
    });

    test.afterAll(async () => {
      await k8sClient.deleteNamespace(namespace);
    });

    test('KN-05-TC04: Create knative workload from Git', async ({ page }) => {
      const addFlowPage = new AddFlowPage(page);
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Navigate to Add page and import from Git', async () => {
        await addFlowPage.navigateToAddPage(namespace);
        await addFlowPage.clickImportFromGitCard();
      });

      await test.step('Enter Git URL and configure workload', async () => {
        await addFlowPage.enterGitUrl(GIT_URL);
        await addFlowPage.selectBuilderImage('Node.js');
        await addFlowPage.enterComponentName(SERVICE_NAME);
        await addFlowPage.selectServerlessDeployment();
      });

      await test.step('Submit and verify topology', async () => {
        await addFlowPage.clickCreate();
        await expect(page).toHaveURL(/topology/, { timeout: 30_000 });
      });

      await test.step('Verify workload visible in topology', async () => {
        await topologyPage.verifyWorkloadVisible(SERVICE_NAME);
      });
    });

    test('KN-02-TC02: Edit labels modal details', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Right-click service and select Edit labels', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.rightClickAndSelectAction(SERVICE_NAME, 'Edit labels');
      });

      await test.step('Verify modal with save and cancel buttons', async () => {
        await expect(topologyPage.getModalTitle()).toContainText('Edit labels');
        await expect(page.locator('[data-test="confirm-action"]')).toBeVisible();
        await expect(topologyPage.getModalCancel()).toBeVisible();
        await topologyPage.getModalCancel().click();
      });
    });

    test('KN-02-TC17: Edit Annotation modal details', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Right-click service and select Edit annotations', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.rightClickAndSelectAction(SERVICE_NAME, 'Edit annotations');
      });

      await test.step('Verify modal content', async () => {
        await expect(topologyPage.getModalTitle()).toContainText('Edit annotations');
        const nameFields = page.getByTestId('pairs-list-name');
        const valueFields = page.getByTestId('pairs-list-value');
        await expect(nameFields.first()).toBeVisible();
        await expect(valueFields.first()).toBeVisible();
        await expect(page.getByTestId('add-button')).toBeVisible();
        await expect(page.locator('[data-test="confirm-action"]')).toBeVisible();
        await expect(topologyPage.getModalCancel()).toBeVisible();
        await topologyPage.getModalCancel().click();
      });
    });

    test('KA-01-TC01: Create new Event Source via Ping Source', async ({ page }) => {
      test.setTimeout(360_000);
      const eventingPage = new AdminEventingPage(page);

      await test.step('Wait for knative service to be ready', async () => {
        await expect(async () => {
          const svc = await k8sClient.customObjectsApi.getNamespacedCustomObject({
            group: 'serving.knative.dev', version: 'v1',
            namespace, plural: 'services', name: SERVICE_NAME,
          }) as { status?: { conditions?: Array<{ type: string; status: string }> } };
          const ready = svc?.status?.conditions?.find((c) => c.type === 'Ready');
          expect(ready?.status).toBe('True');
        }).toPass({ timeout: 300_000, intervals: [10_000] });
      });

      await test.step('Navigate to Eventing page', async () => {
        await eventingPage.navigateToEventing(namespace);
      });

      await test.step('Click Create dropdown and select Event Source', async () => {
        await eventingPage.selectCreateOption('eventSource');
      });

      await test.step('Select Ping Source', async () => {
        const pingSourceCard = page.getByTestId('EventSource-PingSource');
        await pingSourceCard.click({ timeout: 30_000 });
        const createBtn = page.locator('a[role="button"]').filter({ hasText: /Create/i });
        await createBtn.click({ timeout: 10_000 });
      });

      await test.step('Fill Ping Source form and submit', async () => {
        // TODO: Use URI sink type as workaround — the Resource dropdown has a known bug
        // on OCP 5 (OCPBUGS-95058) where it shows "Error loading - Select resource"
        await eventingPage.fillPingSourceForm(
          'Message',
          '* * * * *',
          `http://${SERVICE_NAME}.${namespace}.svc.cluster.local`,
        );
        await page.getByTestId('save-changes').click();
        await expect(page).toHaveURL(/topology/, { timeout: 30_000 });
      });

      await test.step('Verify event source visible in topology', async () => {
        const topologyPage = new TopologyKnativePage(page);
        await topologyPage.verifyWorkloadVisible('ping-source');
      });
    });

    test('KA-01-TC02: Create new Channel via default channel type', async ({ page }) => {
      const eventingPage = new AdminEventingPage(page);

      await test.step('Navigate to Eventing page', async () => {
        await eventingPage.navigateToEventing(namespace);
      });

      await test.step('Click Create dropdown and select Channel', async () => {
        await eventingPage.selectCreateOption('channels');
      });

      await test.step('Select Default Channel and create', async () => {
        await eventingPage.createChannel('Default Channel');
      });

      await test.step('Verify channel visible in Topology', async () => {
        await expect(page).toHaveURL(/topology/, { timeout: 30_000 });
        const topologyPage = new TopologyKnativePage(page);
        await topologyPage.verifyWorkloadVisible('channel');
      });
    });

    test('KE-05-TC01: Create Broker using Form view', async ({ page }) => {
      const eventingPage = new AdminEventingPage(page);

      await test.step('Navigate to Eventing page', async () => {
        await eventingPage.navigateToEventing(namespace);
      });

      await test.step('Click Create dropdown and select Broker', async () => {
        await eventingPage.selectCreateOption('brokers');
      });

      await test.step('Select Form view, enter name and create', async () => {
        await eventingPage.createBroker('default-broker');
      });

      await test.step('Verify broker visible in Topology', async () => {
        await expect(page).toHaveURL(/topology/, { timeout: 30_000 });
        const topologyPage = new TopologyKnativePage(page);
        await topologyPage.verifyWorkloadVisible('default-broker');
      });
    });

    // TODO: The Add Subscription UI modal has a broken Subscriber dropdown on OCP 5
    // (OCPBUGS-95058). The dropdown shows "Error loading - Select Subscriber" and cannot
    // list Knative Services. Works on OCP 4. Creating subscription via API as workaround.
    test('Add Subscription to channel', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Create subscription via API', async () => {
        await k8sClient.customObjectsApi.createNamespacedCustomObject({
          group: 'messaging.knative.dev',
          version: 'v1',
          namespace,
          plural: 'subscriptions',
          body: {
            apiVersion: 'messaging.knative.dev/v1',
            kind: 'Subscription',
            metadata: { name: 'channel-subscrip', namespace },
            spec: {
              channel: {
                apiVersion: 'messaging.knative.dev/v1',
                kind: 'Channel',
                name: 'channel',
              },
              subscriber: {
                ref: {
                  apiVersion: 'serving.knative.dev/v1',
                  kind: 'Service',
                  name: SERVICE_NAME,
                },
              },
            },
          },
        });
      });

      await test.step('Verify subscriber in channel sidebar', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.clickOnTopologyNode('channel');
        await topologyPage.verifySidePaneOpen();
        await expect(topologyPage.getSidePane()).toContainText(SERVICE_NAME);
        await topologyPage.closeSidePane();
      });
    });

    test('KN-02-TC08: Update service to new application group', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Right-click and select Edit application grouping', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.rightClickAndSelectAction(SERVICE_NAME, 'Edit application grouping');
      });

      await test.step('Create new application group', async () => {
        await expect(topologyPage.getModalTitle()).toContainText('Edit application grouping');
        // If service has no app group, modal shows a text input directly (no dropdown)
        const appDropdown = page.locator('#form-dropdown-application-name-field');
        const appInput = page.getByTestId('application-form-app-input');
        if ((await appDropdown.count()) > 0) {
          await appDropdown.click();
          await page.locator('[data-test="#CREATE_APPLICATION_KEY#"], [data-test-dropdown-menu="#CREATE_APPLICATION_KEY#"]').first().click();
        }
        await appInput.clear();
        await appInput.fill('openshift-app');
        await page.locator('button[type=submit]').click();
        await expect(topologyPage.getModalCancel()).not.toBeAttached({ timeout: 10_000 });
      });

      await test.step('Verify service is in new application group', async () => {
        await topologyPage.verifyWorkloadVisible('openshift-app');
        await topologyPage.clickOnApplicationGrouping('openshift-app');
        await topologyPage.verifySidePaneOpen();
        await expect(topologyPage.getSidePane()).toContainText(SERVICE_NAME);
      });
    });

    test('KN-01-TC12: Delete Revision not possible for single revision', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Right-click revision and select Delete Revision', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.rightClickRevisionAndSelectAction(SERVICE_NAME, 'Delete Revision');
      });

      await test.step('Verify unable-to-delete modal', async () => {
        await expect(page.getByText('Unable to delete Revision')).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText('You cannot delete the last Revision for the Service.')).toBeVisible();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
      });
    });

    test('Create Revision for existing knative Service', async ({ page }) => {
      test.setTimeout(300_000);

      await test.step('Edit service to create a new revision', async () => {
        await page.goto(`/edit/ns/${namespace}?name=${SERVICE_NAME}&kind=serving.knative.dev~v1~Service`);
        await page.waitForLoadState('load');
        await page.locator('button').filter({ hasText: 'Labels' }).click({ timeout: 30_000 });
        const labelsInput = page.getByTestId('labels');
        await labelsInput.fill('app=frontend');
        await labelsInput.press('Enter');
        await page.getByTestId('save-changes').click();
        await expect(page).toHaveURL(/topology/, { timeout: 30_000 });
      });

      await test.step('Verify multiple revisions via API', async () => {
        await expect(async () => {
          const revisions = (await k8sClient.customObjectsApi.listNamespacedCustomObject({
            group: 'serving.knative.dev',
            version: 'v1',
            namespace,
            plural: 'revisions',
            labelSelector: `serving.knative.dev/service=${SERVICE_NAME}`,
          })) as { items?: Array<unknown> };
          expect(revisions.items?.length).toBe(2);
        }).toPass({ timeout: 60_000, intervals: [5_000] });
      });
    });

    test('KN-02-TC10: Set traffic distribution >100%', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Open Set traffic distribution modal', async () => {
        await topologyPage.openServiceAction(namespace, SERVICE_NAME, 'Set traffic distribution');
      });

      await test.step('Set traffic >100% and verify error', async () => {
        await expect(
          page.getByText('Set traffic distribution', { exact: true }),
        ).toBeVisible({ timeout: 30_000 });
        await page.getByTestId('add-action').click();
        await page.locator('[id$="percent-field"]').last().clear();
        await page.locator('[id$="percent-field"]').last().fill('50');
        await page.getByTestId('console-select-menu-toggle').nth(1).click();
        await page.getByTestId('console-select-item').first().click();
        await page.locator('button[type=submit]').click();
        await topologyPage.verifyTrafficDistributionError('Traffic targets sum to 150, want 100');
      });
    });

    test('KN-02-TC11: Set traffic distribution <100%', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Open Set traffic distribution modal', async () => {
        await topologyPage.openServiceAction(namespace, SERVICE_NAME, 'Set traffic distribution');
      });

      await test.step('Set traffic <100% and verify error', async () => {
        await expect(
          page.getByText('Set traffic distribution', { exact: true }),
        ).toBeVisible({ timeout: 30_000 });
        await page.locator('[id$="percent-field"]').first().clear();
        await page.locator('[id$="percent-field"]').first().fill('25');
        await page.getByTestId('add-action').click();
        await page.locator('[id$="percent-field"]').last().clear();
        await page.locator('[id$="percent-field"]').last().fill('50');
        await page.getByTestId('console-select-menu-toggle').nth(1).click();
        await page.getByTestId('console-select-item').first().click();
        await page.locator('button[type=submit]').click();
        await topologyPage.verifyTrafficDistributionError('Traffic targets sum to 75, want 100');
      });
    });

    test('KE-05-TC11: Delete Broker', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Right-click broker and select Delete Broker', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.verifyWorkloadVisible('default-broker');
        await topologyPage.search('');
        await topologyPage.fitScreen();
        await topologyPage.rightClickNodeAndSelectAction('default-broker', 'Delete Broker');
      });

      await test.step('Confirm deletion', async () => {
        await expect(topologyPage.getModalTitle()).toContainText('Delete');
        await page.locator('button[type=submit]').click();
        await expect(topologyPage.getModalCancel()).not.toBeAttached({ timeout: 10_000 });
      });

      await test.step('Verify broker removed', async () => {
        await topologyPage.verifyResourceRemoved('default-broker');
      });
    });

    test('KE-06-TC16: Delete Channel', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Right-click channel and select Delete Channel', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.verifyWorkloadVisible('channel');
        await topologyPage.search('');
        await topologyPage.fitScreen();
        await topologyPage.rightClickNodeAndSelectAction('channel', 'Delete Channel');
      });

      await test.step('Confirm deletion', async () => {
        await expect(topologyPage.getModalTitle()).toContainText('Delete');
        await page.locator('button[type=submit]').click();
        await expect(topologyPage.getModalCancel()).not.toBeAttached({ timeout: 10_000 });
      });

      await test.step('Verify channel removed', async () => {
        await topologyPage.verifyResourceRemoved('channel');
      });
    });

    test('KE-01-TC03: Delete event source', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Right-click event source and select Delete PingSource', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.verifyWorkloadVisible('ping-source');
        await topologyPage.search('');
        await topologyPage.fitScreen();
        await topologyPage.rightClickNodeAndSelectAction('ping-source', 'Delete PingSource');
      });

      await test.step('Confirm deletion', async () => {
        await expect(topologyPage.getModalTitle()).toContainText('Delete');
        await page.locator('button[type=submit]').click();
        await expect(topologyPage.getModalCancel()).not.toBeAttached({ timeout: 10_000 });
      });

      await test.step('Verify event source removed', async () => {
        await topologyPage.verifyResourceRemoved('ping-source', 30_000);
      });
    });

    test('KN-02-TC16: Delete service', async ({ page }) => {
      const topologyPage = new TopologyKnativePage(page);

      await test.step('Right-click service and select Delete Service', async () => {
        await topologyPage.navigateToTopology(namespace);
        await topologyPage.rightClickAndSelectAction(SERVICE_NAME, 'Delete Service');
      });

      await test.step('Confirm deletion', async () => {
        await expect(topologyPage.getModalTitle()).toContainText('Delete Service?');
        await page.locator('button[type=submit]').click();
        await expect(topologyPage.getModalCancel()).not.toBeAttached();
      });

      await test.step('Verify service removed', async () => {
        await page.reload();
        await expect(
          page.locator('[data-type="knative-service"]'),
        ).not.toBeAttached({ timeout: 30_000 });
      });
    });
  },
);
