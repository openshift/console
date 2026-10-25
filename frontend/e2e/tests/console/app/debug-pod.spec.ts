import type KubernetesClient from '../../../clients/kubernetes-client';
import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { retryOnModelNotFound } from '../../../utils/retry-model-error';

const POD_NAME = 'pod1';
const CONTAINER_NAME = 'container1';
const DEBUG_POD_PREFIX = `${POD_NAME}-debug-`;

type DebugPodInfo = {
  name: string;
  podIP: string;
};

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
      command:
        - /bin/sh
        - -c
        - exit 1
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
          - ALL
  restartPolicy: Always`;

async function waitForPodCrashLoopBackOff(
  k8sClient: KubernetesClient,
  namespace: string,
  podName: string,
  timeoutMs = 120_000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        try {
          const pods = await k8sClient.getPods(namespace);
          const pod = pods.find((p) => p.metadata?.name === podName);
          return pod?.status?.containerStatuses?.find((c) => c.name === CONTAINER_NAME)?.state
            ?.waiting?.reason;
        } catch {
          return undefined;
        }
      },
      { timeout: timeoutMs },
    )
    .toBe('CrashLoopBackOff');
}

async function waitForDebugPodRunning(
  k8sClient: KubernetesClient,
  namespace: string,
  timeoutMs = 120_000,
): Promise<DebugPodInfo> {
  let debugPodInfo: DebugPodInfo | undefined;

  await expect
    .poll(
      async () => {
        const pods = await k8sClient.getPods(namespace);
        const debugPod = pods.find(
          (p) =>
            p.metadata?.name?.startsWith(DEBUG_POD_PREFIX) &&
            !p.metadata.deletionTimestamp &&
            p.status?.phase === 'Running' &&
            p.status.podIP,
        );
        if (!debugPod?.metadata?.name || !debugPod.status?.podIP) {
          return false;
        }
        debugPodInfo = { name: debugPod.metadata.name, podIP: debugPod.status.podIP };
        return true;
      },
      { timeout: timeoutMs },
    )
    .toBe(true);

  if (!debugPodInfo) {
    throw new Error('Debug pod reached Running without a name or IP address');
  }
  return debugPodInfo;
}

async function waitForNoDebugPods(
  k8sClient: KubernetesClient,
  namespace: string,
  timeoutMs = 60_000,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const pods = await k8sClient.getPods(namespace);
        return pods.filter((p) => p.metadata?.name?.startsWith(DEBUG_POD_PREFIX)).length;
      },
      { timeout: timeoutMs },
    )
    .toBe(0);
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
    let lastDebugPod: DebugPodInfo | undefined;

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
      await waitForPodCrashLoopBackOff(k8sClient, ns, POD_NAME);
    });

    await test.step('Open debug terminal from Logs tab', async () => {
      await listPage.navigateToListPage(`/k8s/ns/${ns}/pods`);
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });

      await detailsPage.navigateToDetailsPage(`/k8s/ns/${ns}/pods/${POD_NAME}`);
      await detailsPage.waitForPageLoad();
      await retryOnModelNotFound(page);
      await detailsPage.selectTab('Logs');

      await detailsPage.clickDebugContainerFromLogs();
      await expect(listPage.heading).toContainText(`Debug ${CONTAINER_NAME}`, {
        timeout: 30_000,
      });
      await waitForDebugPodRunning(k8sClient, ns);
      await detailsPage.waitForTerminalReady();

      await detailsPage.getBreadcrumb(0).click();
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });
      await waitForNoDebugPods(k8sClient, ns);
    });

    await test.step('Open debug terminal from Pod Details status popover', async () => {
      await detailsPage.navigateToDetailsPage(`/k8s/ns/${ns}/pods/${POD_NAME}`);
      await detailsPage.waitForPageLoad();
      await retryOnModelNotFound(page);
      await waitForPodCrashLoopBackOff(k8sClient, ns, POD_NAME);

      await detailsPage.clickStatusButton();
      await detailsPage.clickDebugContainerLink(CONTAINER_NAME);

      await expect(listPage.heading).toContainText(`Debug ${CONTAINER_NAME}`, {
        timeout: 30_000,
      });
      await waitForDebugPodRunning(k8sClient, ns);
      await detailsPage.waitForTerminalReady();

      await detailsPage.getBreadcrumb(0).click();
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });
      await waitForNoDebugPods(k8sClient, ns);
    });

    await test.step('Open debug terminal from Pods list status popover', async () => {
      await listPage.navigateToListPage(`/k8s/ns/${ns}/pods`);
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });
      await waitForPodCrashLoopBackOff(k8sClient, ns, POD_NAME);

      await listPage.clickStatusButton(POD_NAME);
      await listPage.clickDebugContainerLink(CONTAINER_NAME);

      await expect(listPage.heading).toContainText(`Debug ${CONTAINER_NAME}`, {
        timeout: 30_000,
      });
      lastDebugPod = await waitForDebugPodRunning(k8sClient, ns);
      await detailsPage.waitForTerminalReady();
    });

    await test.step('Verify debug pod has a different IP than the main pod', async () => {
      const pods = await k8sClient.getPods(ns);
      const mainPod = pods.find((p) => p.metadata?.name === POD_NAME);
      expect(mainPod?.status?.podIP).toBeTruthy();
      expect(lastDebugPod?.podIP).toBeTruthy();
      expect(mainPod?.status?.podIP).not.toEqual(lastDebugPod?.podIP);
    });

    await test.step('Verify debug pod is terminated after leaving debug page', async () => {
      await detailsPage.getBreadcrumb(0).click();
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });
      await waitForNoDebugPods(k8sClient, ns);

      await listPage.navigateToListPage(`/k8s/ns/${ns}/pods`);
      await expect(listPage.cell(POD_NAME)).toBeVisible({ timeout: 30_000 });
      if (!lastDebugPod) {
        throw new Error('Expected the final debug pod to have been created');
      }
      await expect(listPage.cell(lastDebugPod.name)).not.toBeAttached();
    });
  });
});
