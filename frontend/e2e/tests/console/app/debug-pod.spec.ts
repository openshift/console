import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';

const POD_NAME = 'pod1';
const CONTAINER_NAME = 'container1';
const podToDebug = `apiVersion: v1
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

async function pollForPodCrashState(
  k8sClient: any,
  namespace: string,
  podName: string,
  timeoutMs: number,
): Promise<{ ready: boolean; reason: string }> {
  const deadline = Date.now() + timeoutMs;
  let lastReason = 'pod not found';

  while (Date.now() < deadline) {
    try {
      const pods = await k8sClient.getPods(namespace);
      const pod = pods.find((p: any) => p.metadata?.name === podName);
      if (!pod) {
        lastReason = 'pod not found';
      } else if (!pod.status?.containerStatuses?.length) {
        lastReason = `phase=${pod.status?.phase || 'unknown'}, no containerStatuses yet`;
      } else {
        const container = pod.status.containerStatuses[0];
        const waitingReason = container?.state?.waiting?.reason;
        const restartCount = container?.restartCount ?? 0;

        if (waitingReason === 'CrashLoopBackOff' || restartCount >= 1) {
          return { ready: true, reason: waitingReason || `restartCount=${restartCount}` };
        }

        if (waitingReason === 'ImagePullBackOff' || waitingReason === 'ErrImagePull') {
          lastReason = `image pull failed: ${waitingReason}`;
        } else if (waitingReason) {
          lastReason = `waiting: ${waitingReason}`;
        } else if (container?.state?.running) {
          lastReason = 'container running (not crashing yet)';
        } else if (container?.state?.terminated) {
          lastReason = `terminated: reason=${container.state.terminated.reason}, exitCode=${container.state.terminated.exitCode}`;
        } else {
          lastReason = `unknown state: ${JSON.stringify(container?.state)}`;
        }
      }
    } catch (err) {
      lastReason = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  return { ready: false, reason: lastReason };
}

test.describe.serial('Debug pod', { tag: ['@admin'] }, () => {
  const testNs = `e2e-debug-pod-${Date.now()}`;

  test.beforeAll(async ({ k8sClient }) => {
    // Create namespace WITHOUT openshift.io/run-level label so that SCC admission
    // injects the correct runAsUser for pods with runAsNonRoot: true
    await k8sClient.coreV1Api.createNamespace({
      body: { metadata: { name: testNs } },
    });
    await k8sClient.waitForNamespaceReady(testNs);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(testNs);
  });

  test('Create pod that has crashbackloop error', async ({ page, k8sClient }) => {
    test.setTimeout(300_000);
    const yamlEditor = new YamlEditorPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/import`);
    await yamlEditor.isImportLoaded();
    await yamlEditor.setEditorContent(podToDebug);
    await yamlEditor.clickSaveCreateButton();
    await expect(page.getByTestId('yaml-error')).toBeHidden();
    await detailsPage.sectionHeaderShouldExist('Pod details');

    // Wait for pod to enter CrashLoopBackOff so debug links appear in subsequent tests
    const podState = await pollForPodCrashState(k8sClient, testNs, POD_NAME, 120_000);
    expect(podState.ready, `Pod never crashed. Last state: ${podState.reason}`).toBe(true);
  });

  test('Opens debug terminal page from Logs subsection', async ({ page }) => {
    test.setTimeout(300_000);
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/pods`);
    await listPage.dvRowsShouldExist(POD_NAME);
    await page.goto(`/k8s/ns/${testNs}/pods/${POD_NAME}`);
    await detailsPage.isLoaded();
    await detailsPage.selectTab('Logs');
    await detailsPage.isLoaded();
    await detailsPage.clickDebugContainerLink();
    await listPage.titleShouldHaveText(`Debug ${CONTAINER_NAME}`);
    await expect(detailsPage.xtermViewport).toBeAttached({ timeout: 30_000 });
    await detailsPage.clickBreadcrumb();
    await listPage.dvRowsShouldExist(POD_NAME);
  });

  test('Opens debug terminal page from Pod Details - Status tool tip', async ({ page }) => {
    test.setTimeout(300_000);
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/pods/${POD_NAME}`);
    await detailsPage.isLoaded();
    await detailsPage.clickStatusPopover();
    // Regression test for OCPBUGS-83813: Wait for popover content to be stable before clicking
    // https://issues.redhat.com/browse/OCPBUGS-83813
    const debugLink = detailsPage.debugContainerLink(CONTAINER_NAME);
    await expect(debugLink).toBeVisible({ timeout: 30_000 });
    await detailsPage.clickDebugContainerLink(CONTAINER_NAME);
    await listPage.titleShouldHaveText(`Debug ${CONTAINER_NAME}`);
    await expect(detailsPage.xtermViewport).toBeAttached({ timeout: 30_000 });
    await detailsPage.clickBreadcrumb();
    await listPage.dvRowsShouldExist(POD_NAME);
  });

  test('Opens debug terminal page from Pods Page - Status tool tip', async ({
    page,
    k8sClient,
  }) => {
    test.setTimeout(300_000);
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/pods`);
    await listPage.dvRowsShouldExist(POD_NAME);
    await listPage.dvRowsClickStatusButton(POD_NAME);
    // Regression test for OCPBUGS-83813: Wait for popover content to be stable before clicking
    // https://issues.redhat.com/browse/OCPBUGS-83813
    const debugLink = detailsPage.debugContainerLink(CONTAINER_NAME);
    await expect(debugLink).toBeVisible({ timeout: 30_000 });
    await debugLink.click();
    await listPage.titleShouldHaveText(`Debug ${CONTAINER_NAME}`);
    await expect(detailsPage.xtermViewport).toBeAttached({ timeout: 30_000 });

    // Debug pod should not copy main pod network info
    const pods = await k8sClient.getPods(testNs);
    expect(pods.length).toBeGreaterThanOrEqual(2);
    const mainPod = pods.find((p: any) => p.metadata?.name === POD_NAME);
    const debugPod = pods.find((p: any) => p.metadata?.name !== POD_NAME);
    expect(mainPod?.status?.podIP).toBeTruthy();
    expect(debugPod?.status?.podIP).toBeTruthy();
    expect(mainPod?.status?.podIP).not.toEqual(debugPod?.status?.podIP);

    await detailsPage.clickBreadcrumb();
    await listPage.dvRowsShouldExist(POD_NAME);
  });

  test('Debug pod should be terminated after leaving debug container page', async ({
    page,
    k8sClient,
  }) => {
    const listPage = new ListPage(page);

    await page.goto(`/k8s/ns/${testNs}/pods`);
    await listPage.dvRowsShouldExist(POD_NAME);
    await listPage.filterByStatus('Running');

    await expect
      .poll(
        async () => {
          const pods = await k8sClient.getPods(testNs);
          return pods.filter((p: any) => p.metadata?.name !== POD_NAME).length;
        },
        { timeout: 60_000 },
      )
      .toBe(0);
  });
});
