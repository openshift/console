import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { LogsPage } from '../../../pages/logs-page';

const examplePodSpec = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: { name: 'examplepod1', labels: { app: 'httpd' } },
  spec: {
    securityContext: { runAsNonRoot: true, seccompProfile: { type: 'RuntimeDefault' } },
    containers: [
      {
        name: 'container1',
        image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
        args: [
          '/bin/sh',
          '-c',
          'i=0; while true; do echo "$i:Log   TEST   $(date)" >> /var/log/1.log; echo "$(date):Log    INFO     $i" >> /var/log/2.log; i=$((i+1)); sleep 1; done',
        ],
        volumeMounts: [{ name: 'varlog', mountPath: '/var/log' }],
        securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: ['ALL'] } },
      },
      {
        name: 'container2',
        image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
        args: ['/bin/sh', '-c', 'tail -n+1 -f /var/log/1.log'],
        volumeMounts: [{ name: 'varlog', mountPath: '/var/log' }],
        securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: ['ALL'] } },
      },
    ],
    volumes: [{ name: 'varlog', emptyDir: {} }],
  },
};

const wrapPodSpec = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: 'wraplogpod',
    annotations: { 'console.openshift.io/wrap-log-lines': 'true' },
    labels: { app: 'hello-openshift' },
  },
  spec: {
    securityContext: { runAsNonRoot: true, seccompProfile: { type: 'RuntimeDefault' } },
    containers: [
      {
        name: 'hello-openshift',
        image:
          'quay.io/openshifttest/hello-openshift@sha256:b6296396b632d15daf9b5e62cf26da20d76157161035fefddbd0e7f7749f4167',
        ports: [{ containerPort: 80 }],
        securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: ['ALL'] } },
      },
    ],
  },
};

test.describe('Pod log viewer', { tag: ['@admin'] }, () => {
  test('verifies default log buffer and full log', async ({ page }) => {
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);
    const logsPage = new LogsPage(page);

    await test.step('Navigate to kube-apiserver pods', async () => {
      await page.goto('/k8s/ns/openshift-kube-apiserver/core~v1~Pod');
      await listPage.waitForRows();
    });

    await test.step('Open first kube-apiserver pod', async () => {
      await listPage.clickFirstRowLinkMatching(/^kube-apiserver-(?!.*guard)/);
      await detailsPage.waitForLoaded();
    });

    await test.step('Verify default log buffer size', async () => {
      await detailsPage.selectTab('Logs');
      await expect(logsPage.lineCount).toContainText('1000 lines');
    });

    await test.step('Verify full log exceeds default buffer', async () => {
      await logsPage.clickShowFullLog();
      await expect(logsPage.lineCount).not.toContainText('1000 lines', { timeout: 30_000 });
    });
  });

  test('supports whitespace retention and log search', async ({ page, k8sClient, cleanup }) => {
    const logsPage = new LogsPage(page);
    const ns = `test-log-${Date.now()}`;

    await test.step('Create namespace and pod', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPod(ns, examplePodSpec);
      await k8sClient.waitForPodReady('examplepod1', ns);
    });

    await test.step('Navigate to pod logs and select container2', async () => {
      await page.goto(`/k8s/ns/${ns}/pods/examplepod1/logs`);
      await logsPage.waitForLoaded();
      await logsPage.selectContainer('container2');
    });

    await test.step('Verify whitespace preserved with wrap enabled', async () => {
      await logsPage.setWrap(true);
      await expect(logsPage.logText.first()).toContainText('Log   TEST', { timeout: 60_000 });
    });

    await test.step('Verify whitespace preserved with wrap disabled', async () => {
      await logsPage.setWrap(false);
      await expect(logsPage.logText.first()).toContainText('Log   TEST');
    });

    await test.step('Verify log search finds matches', async () => {
      await logsPage.searchLogs('test');
      await expect(logsPage.searchMatches.first()).toBeAttached({ timeout: 10_000 });
      expect(await logsPage.searchMatches.count()).toBeGreaterThan(0);
    });
  });

  test('respects wrap-log-lines pod annotation', async ({ page, k8sClient, cleanup }) => {
    test.setTimeout(240_000);
    const logsPage = new LogsPage(page);
    const ns = `test-wrap-${Date.now()}`;

    await test.step('Create namespace and pods', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createPod(ns, examplePodSpec);
      await k8sClient.createPod(ns, wrapPodSpec);
      await Promise.all([
        k8sClient.waitForPodReady('examplepod1', ns),
        k8sClient.waitForPodReady('wraplogpod', ns),
      ]);
    });

    await test.step('Verify non-annotated pod has wrap disabled', async () => {
      await page.goto(`/k8s/ns/${ns}/pods/examplepod1/logs`);
      await logsPage.waitForLoaded();
      await logsPage.setWrap(false);
      expect(await logsPage.isWrapChecked()).toBe(false);
    });

    await test.step('Verify annotated pod has wrap enabled by default', async () => {
      await page.goto(`/k8s/ns/${ns}/pods/wraplogpod/logs`);
      await logsPage.waitForLoaded();
      expect(await logsPage.isWrapChecked()).toBe(true);
    });

    await test.step('Verify annotation re-asserts wrap after navigation', async () => {
      await logsPage.setWrap(false);
      await page.goto(`/k8s/ns/${ns}/pods/examplepod1/logs`);
      await logsPage.waitForLoaded();
      expect(await logsPage.isWrapChecked()).toBe(false);
      await page.goto(`/k8s/ns/${ns}/pods/wraplogpod/logs`);
      await logsPage.waitForLoaded();
      expect(await logsPage.isWrapChecked()).toBe(true);
    });
  });
});
