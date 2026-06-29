import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';

const POD_NAME = 'pod1';
const DEPLOY_NAME = 'deploy1';
const CONTAINER_NAME = 'container1';
const WARNING_FOO = '299 - "[pod-must-have-label-foo] you must provide labels: {"foo"}"';
const WARNING_BAR = '299 - "[deployment-must-have-label-bar] you must provide labels: {"bar"}"';
const LEARN_MORE_ID = 'admission-webhook-warning-learn-more';
const WARNING_ID = 'admission-webhook-warning';

test.describe('Admission Webhook warning notification', { tag: ['@admin'] }, () => {
  const testNs = `e2e-admission-${Date.now()}`;

  const pod1ReqObj = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}-a
  labels:
    app: httpd
  namespace: ${testNs}
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

  const bulkResourcesReqObj = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}-b
  labels:
    app: httpd
  namespace: ${testNs}
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
  annotations: {}
  namespace: ${testNs}
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
  paused: false
`;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(testNs);
    await k8sClient.waitForNamespaceReady(testNs);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(testNs);
  });

  test('Create a pod and display Admission Webhook warning notification', async ({ page }) => {
    const yamlEditor = new YamlEditorPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/import`);
    await yamlEditor.isImportLoaded();
    await yamlEditor.setEditorContent(pod1ReqObj);

    await page.route(`**/api/kubernetes/api/v1/namespaces/${testNs}/pods`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          Warning: WARNING_FOO,
        },
      });
    });

    await yamlEditor.clickSaveCreateButton();
    await detailsPage.sectionHeaderShouldExist('Pod details');

    const warning = detailsPage.admissionWarning(WARNING_ID);
    await expect(warning).toContainText('Admission Webhook Warning');
    await expect(warning).toContainText(`Pod ${POD_NAME}-a violates policy ${WARNING_FOO}`);

    const learnMore = detailsPage.admissionWarning(LEARN_MORE_ID);
    await expect(learnMore).toContainText('Learn more');
    await learnMore.click();
  });

  test('Create bulk resources and display Admission Webhook warning notifications', async ({
    page,
  }) => {
    const yamlEditor = new YamlEditorPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/import`);
    await yamlEditor.isImportLoaded();
    await yamlEditor.setEditorContent(bulkResourcesReqObj);

    await page.route(`**/api/kubernetes/api/v1/namespaces/${testNs}/pods`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          Warning: WARNING_FOO,
        },
      });
    });

    await page.route(
      `**/api/kubernetes/apis/apps/v1/namespaces/${testNs}/deployments`,
      async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: {
            ...response.headers(),
            Warning: WARNING_BAR,
          },
        });
      },
    );

    await yamlEditor.clickSaveCreateButton();

    await expect(detailsPage.resourcesSuccessMessage).toContainText(
      'Resources successfully created',
    );

    const warning = detailsPage.admissionWarning(WARNING_ID);
    await expect(warning).toHaveCount(2);
    await expect(warning.first()).toContainText('Admission Webhook Warning');
    await expect(
      warning.filter({ hasText: `Pod ${POD_NAME}-b violates policy ${WARNING_FOO}` }),
    ).toBeVisible();
    await expect(
      warning.filter({ hasText: `Deployment ${DEPLOY_NAME} violates policy ${WARNING_BAR}` }),
    ).toBeVisible();

    const learnMore = detailsPage.admissionWarning(LEARN_MORE_ID);
    await expect(learnMore.first()).toContainText('Learn more');
    await learnMore.first().click();
  });
});
