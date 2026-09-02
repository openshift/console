import type KubernetesClient from '../../../clients/kubernetes-client';
import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { retryOnModelNotFound } from '../../../utils/retry-model-error';

const POD_NAME = 'pod1';
const CONTAINER_NAME = 'container1';

const podYaml = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: ${CONTAINER_NAME}
      image: quay.io/fedora/fedora
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
          - ALL
  restartPolicy: Always`;

async function waitForPodCrashState(
  k8sClient: KubernetesClient,
  namespace: string,
  podName: string,
  timeoutMs = 120_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const pods = await k8sClient.getPods(namespace);
      const pod = pods.find((p) => p.metadata?.name === podName);
      if (!pod) {
        await new Promise((r) => setTimeout(r, 3_000));
        continue;
      }
      const container = pod.status?.containerStatuses?.[0];
      const waitingReason = container?.state?.waiting?.reason;
      const restartCount = container?.restartCount ?? 0;
      if (
        waitingReason === 'CrashLoopBackOff' ||
        waitingReason === 'CreateContainerConfigError' ||
        restartCount >= 1
      ) {
        return true;
      }
    } catch {
      // API call failed, retry
    }

    await new Promise((r) => setTimeout(r, 3_000));
  }
  return false;
}

test.describe('Debug pod', () => {
  let ns: string;

  test.beforeAll(async ({ k8sClient }) => {
    ns = `test-debug-pod-${Date.now()}`;
    // Create namespace without openshift.io/run-level label so that SCC
    // injects the correct runAsUser for pods with runAsNonRoot: true.
    await k8sClient.coreV1Api.createNamespace({
      body: { metadata: { name: ns } },
    });
    await k8sClient.waitForNamespaceReady(ns);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(ns);
  });

  test('debug terminal is accessible from logs, pod details status, and pod list status', async ({
    page,
    k8sClient,
  }) => {
    // This test is image-pull and reconcile heavy: it waits for a pod to
    // CrashLoopBackOff and then spins up three separate debug pods. On a cold or
    // slow CI cluster the default 300s is not enough, so allow more headroom.
    test.setTimeout(480_000);

    const detailsPage = new DetailsPage(page);
    const listPage = new ListPage(page);
    const yamlEditorPage = new YamlEditorPage(page);

    await test.step('Create pod via YAML import', async () => {
      await yamlEditorPage.navigateToImportYaml(ns);
      await yamlEditorPage.waitForEditorReady();
      await yamlEditorPage.setEditorContent(podYaml);
      await yamlEditorPage.clickSave();
      await expect(yamlEditorPage.getYamlError()).not.toBeAttached();
      await expect(page.getByTestId('section-heading-Pod details')).toBeVisible({
        timeout: 30_000,
      });
    });

    await test.step('Wait for pod to enter CrashLoopBackOff', async () => {
      const crashed = await waitForPodCrashState(k8sClient, ns, POD_NAME);
      expect(crashed, 'Pod never entered a crash/error state').toBe(true);
    });

    await test.step('Open debug terminal from Logs tab', async () => {
      await listPage.navigateToListPage(`/k8s/ns/${ns}/pods`);
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });

      await detailsPage.navigateToDetailsPage(`/k8s/ns/${ns}/pods/${POD_NAME}`);
      await detailsPage.waitForPageLoad();
      await retryOnModelNotFound(page);
      await detailsPage.selectTab('Logs');

      await page.getByTestId('debug-container-link').click({ timeout: 30_000 });
      await expect(listPage.heading).toContainText(`Debug ${CONTAINER_NAME}`, {
        timeout: 30_000,
      });
      await expect(detailsPage.xtermViewport).toBeAttached({ timeout: 30_000 });

      await detailsPage.getBreadcrumb(0).click();
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Open debug terminal from Pod Details status popover', async () => {
      await detailsPage.navigateToDetailsPage(`/k8s/ns/${ns}/pods/${POD_NAME}`);
      await detailsPage.waitForPageLoad();
      await retryOnModelNotFound(page);

      await page.getByTestId('popover-status-button').click({ timeout: 60_000 });
      const debugLink = page.getByTestId(`popup-debug-container-link-${CONTAINER_NAME}`);
      await expect(debugLink).toBeVisible({ timeout: 10_000 });
      await debugLink.click();

      await expect(listPage.heading).toContainText(`Debug ${CONTAINER_NAME}`, {
        timeout: 30_000,
      });
      await expect(detailsPage.xtermViewport).toBeAttached({ timeout: 30_000 });

      await detailsPage.getBreadcrumb(0).click();
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Open debug terminal from Pods list status popover', async () => {
      await listPage.navigateToListPage(`/k8s/ns/${ns}/pods`);
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });

      await listPage.clickStatusButton(POD_NAME);
      const debugLink = page.getByTestId(`popup-debug-container-link-${CONTAINER_NAME}`);
      await expect(debugLink).toBeVisible({ timeout: 10_000 });
      await debugLink.click();

      await expect(listPage.heading).toContainText(`Debug ${CONTAINER_NAME}`, {
        timeout: 30_000,
      });
      await expect(detailsPage.xtermViewport).toBeAttached({ timeout: 30_000 });
    });

    await test.step('Verify debug pod has a different IP than the main pod', async () => {
      const pods = await k8sClient.getPods(ns);
      expect(pods.length).toBeGreaterThanOrEqual(2);
      const mainPod = pods.find((p) => p.metadata?.name === POD_NAME);
      const debugPod = pods.find((p) => p.metadata?.name !== POD_NAME);
      expect(mainPod?.status?.podIP).toBeTruthy();
      expect(debugPod?.status?.podIP).toBeTruthy();
      expect(mainPod?.status?.podIP).not.toEqual(debugPod?.status?.podIP);
    });

    await test.step('Verify debug pod is terminated after leaving debug page', async () => {
      await detailsPage.getBreadcrumb(0).click();
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });

      await listPage.navigateToListPage(`/k8s/ns/${ns}/pods`);
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });
      await listPage.filterByCheckbox('Status', 'Running');

      await expect
        .poll(
          async () => {
            const pods = await k8sClient.getPods(ns);
            return pods.filter((p) => p.metadata?.name !== POD_NAME).length;
          },
          { timeout: 60_000 },
        )
        .toBe(0);
    });
  });
});
