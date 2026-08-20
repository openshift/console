import { test, expect } from '../../../fixtures';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';

const POD_NAME = 'pod1';
const DEPLOY_NAME = 'deploy1';
const CONTAINER_NAME = 'container1';
const WARNING_FOO = '299 - "[pod-must-have-label-foo] you must provide labels: {"foo"}"';
const WARNING_BAR = '299 - "[deployment-must-have-label-bar] you must provide labels: {"bar"}"';
const WARNING_ID = 'admission-webhook-warning';
const LEARN_MORE_ID = 'admission-webhook-warning-learn-more';

test.describe('Admission Webhook warning notification', () => {
  let ns: string;

  test.beforeAll(async ({ k8sClient }) => {
    ns = `test-webhook-warn-${Date.now()}`;
    await k8sClient.createNamespace(ns);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(ns);
  });

  test('displays warning notification when creating a pod', async ({ page }) => {
    const yamlEditorPage = new YamlEditorPage(page);

    const podYaml = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}-a
  labels:
    app: httpd
  namespace: ${ns}
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: ${CONTAINER_NAME}
      image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest'
      ports:
        - containerPort: 8080
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL`;

    await yamlEditorPage.navigateToImportYaml(ns);
    await yamlEditorPage.waitForEditorReady();
    await yamlEditorPage.setEditorContent(podYaml);

    await page.route(`**/api/kubernetes/api/v1/namespaces/${ns}/pods`, async (route) => {
      if (route.request().method() === 'POST') {
        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: { ...response.headers(), Warning: WARNING_FOO },
        });
      } else {
        await route.continue();
      }
    });

    await yamlEditorPage.clickSave();

    await expect(page.getByTestId('section-heading-Pod details')).toBeVisible({ timeout: 30_000 });
    const warning = page.getByTestId(WARNING_ID);
    await expect(warning).toContainText('Admission Webhook Warning', { timeout: 10_000 });
    await expect(warning).toContainText(
      `Pod ${POD_NAME}-a violates policy ${WARNING_FOO}`,
    );
    await expect(page.getByTestId(LEARN_MORE_ID)).toContainText('Learn more');
    await page.getByTestId(LEARN_MORE_ID).click();
  });

  test('displays warning notifications when creating bulk resources', async ({ page }) => {
    const yamlEditorPage = new YamlEditorPage(page);

    const bulkYaml = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}-b
  labels:
    app: httpd
  namespace: ${ns}
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: ${CONTAINER_NAME}
      image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest'
      ports:
        - containerPort: 8080
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${DEPLOY_NAME}
  namespace: ${ns}
spec:
  selector:
    matchLabels:
      app: deploy1
  replicas: 3
  template:
    metadata:
      labels:
        app: deploy1
    spec:
      containers:
        - name: ${CONTAINER_NAME}
          image: >-
            image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest
          ports:
            - containerPort: 8080
              protocol: TCP
          env:
            - name: app
              value: frontennd
      imagePullSecrets: []
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  paused: false`;

    await yamlEditorPage.navigateToImportYaml(ns);
    await yamlEditorPage.waitForEditorReady();
    await yamlEditorPage.setEditorContent(bulkYaml);

    await page.route(`**/api/kubernetes/api/v1/namespaces/${ns}/pods`, async (route) => {
      if (route.request().method() === 'POST') {
        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: { ...response.headers(), Warning: WARNING_FOO },
        });
      } else {
        await route.continue();
      }
    });

    await page.route(
      `**/api/kubernetes/apis/apps/v1/namespaces/${ns}/deployments`,
      async (route) => {
        if (route.request().method() === 'POST') {
          const response = await route.fetch();
          await route.fulfill({
            response,
            headers: { ...response.headers(), Warning: WARNING_BAR },
          });
        } else {
          await route.continue();
        }
      },
    );

    await yamlEditorPage.clickSave();

    await expect(page.getByTestId('resources-successfully-created')).toContainText(
      'Resources successfully created',
      { timeout: 30_000 },
    );
    const warning = page.getByTestId(WARNING_ID);
    await expect(warning).toHaveCount(2, { timeout: 10_000 });
    await expect(warning.first()).toContainText('Admission Webhook Warning');
    await expect(
      warning.filter({ hasText: `Pod ${POD_NAME}-b violates policy ${WARNING_FOO}` }),
    ).toBeVisible();
    await expect(
      warning.filter({ hasText: `Deployment ${DEPLOY_NAME} violates policy ${WARNING_BAR}` }),
    ).toBeVisible();
    await expect(page.getByTestId(LEARN_MORE_ID).first()).toContainText('Learn more');
    await page.getByTestId(LEARN_MORE_ID).first().click();
  });
});
