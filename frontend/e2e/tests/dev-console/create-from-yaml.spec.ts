import { test, expect } from '../../fixtures';
import { setEditorContent, warmupSPA } from '../../pages/base-page';
import { AddPage, ImportYAMLPage } from '../../pages/dev-console/add-page';
import { TopologyPage } from '../../pages/topology-page';

/**
 * Migrated from:
 *   frontend/packages/dev-console/integration-tests/features/addFlow/create-from-yaml.feature
 *
 * All scenarios included.
 */

const GIT_DC_YAML = `apiVersion: apps.openshift.io/v1
kind: DeploymentConfig
metadata:
  name: shell-app
spec:
  replicas: 1
  selector:
    app: shell-app
  template:
    metadata:
      labels:
        app: shell-app
    spec:
      containers:
        - name: shell-app
          image: centos:latest
          command:
            - /bin/sh
            - '-c'
            - >-
              while true ; do date; sleep 1; done;
          securityContext:
            allowPrivilegeEscalation: false
            runAsNonRoot: true
            seccompProfile:
              type: RuntimeDefault
            capabilities:
              drop:
                - ALL
`;

test.describe(
  'Create Application from YAML file',
  { tag: ['@dev-console', '@smoke'] },
  () => {
    const ns = `aut-addflow-yaml-${Date.now()}`;
    let addPage: AddPage;
    let yamlPage: ImportYAMLPage;
    let topologyPage: TopologyPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      yamlPage = new ImportYAMLPage(page);
      topologyPage = new TopologyPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await warmupSPA(page);
      await addPage.ensureDevPerspectiveAndNavigate(ns, k8sClient);
    });

    test('create a workload from YAML file [A-07-TC01]', async ({ page }) => {
      test.slow();

      await test.step('Navigate to Import YAML page', async () => {
        await addPage.clickImportYAML();
      });

      await test.step('Enter YAML content and create', async () => {
        await setEditorContent(page, GIT_DC_YAML);
        await yamlPage.getSubmitButton().click();
        // The editor issues the create POST asynchronously and redirects to the
        // new resource on success. Wait for that redirect before navigating
        // away — otherwise the next navigation aborts the in-flight create
        // request ("Failed to fetch") and the workload is never created.
        await page.waitForURL(/\/deploymentconfigs\/shell-app(\/|$|\?)/, { timeout: 60_000 });
      });

      await test.step('Verify workload in topology', async () => {
        await topologyPage.navigateToTopology(ns);
        await topologyPage.waitForWorkload('shell-app');
        await expect(topologyPage.getWorkload('shell-app')).toBeVisible();
      });
    });

    test('cancel operation on YAML file redirects to Add page [A-07-TC02]', async () => {
      await test.step('Navigate to Import YAML page', async () => {
        await addPage.clickImportYAML();
      });

      await test.step('Click cancel', async () => {
        await yamlPage.getCancelButton().click();
      });

      await test.step('Verify redirect to Add page', async () => {
        await expect(addPage.getPageHeading()).toBeVisible();
      });
    });
  },
);
