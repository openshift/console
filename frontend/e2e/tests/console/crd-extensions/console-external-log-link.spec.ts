import { test, expect } from '../../../fixtures';
import KubernetesClient from '../../../clients/kubernetes-client';
import {
  createCustomResourceViaYaml,
  deleteCustomResourceAndVerify,
  navigateToCRDInstancesViaDetails,
  replaceYamlEditorContent,
  updateCustomResourceViaYaml,
  waitForYamlEditor,
} from './crd-test-utils';

const crd = 'ConsoleExternalLogLink';

test.describe(`${crd} CRD`, { tag: ['@admin'] }, () => {
  let k8sClient: KubernetesClient;
  let name: string;
  let podName: string;
  let projectName: string;
  let crdObj: any;
  let podObj: any;

  test.beforeEach(async ({ k8sClient: client }) => {
    k8sClient = client;

    // Generate unique names for each test run
    const timestamp = Date.now();
    name = `console-external-log-link-test-${timestamp}`;
    podName = `test-pod-${timestamp}`;
    projectName = `test-project-${timestamp}`;

    // Create test project
    await k8sClient.createNamespace(projectName);

    // Prepare ConsoleExternalLogLink object
    crdObj = {
      apiVersion: 'console.openshift.io/v1',
      kind: crd,
      metadata: {
        name,
      },
      spec: {
        text: `${name} Logs`,
        hrefTemplate: 'https://example.com/logs?pod=${resourceName}&namespace=${resourceNamespace}',
      },
    };

    // Prepare Pod object
    podObj = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: podName,
        namespace: projectName,
        labels: {
          app: name,
        },
      },
      spec: {
        securityContext: {
          runAsNonRoot: true,
          seccompProfile: {
            type: 'RuntimeDefault',
          },
        },
        containers: [
          {
            name: 'test-container',
            image: 'registry.access.redhat.com/ubi8/ubi-minimal:latest',
            command: ['sh', '-c', 'echo Hello && sleep 3600'],
            securityContext: {
              allowPrivilegeEscalation: false,
              capabilities: {
                drop: ['ALL'],
              },
            },
          },
        ],
      },
    };
  });

  test.afterEach(async () => {
    // Clean up the Pod
    try {
      await k8sClient.deletePod(podName, projectName);
    } catch (error) {
      // Ignore if already deleted
    }

    // Clean up the ConsoleExternalLogLink instance
    try {
      await k8sClient.deleteCustomResource(
        'console.openshift.io',
        'v1',
        '',
        'consoleexternalloglinks',
        name,
      );
    } catch (error) {
      // Ignore if already deleted
    }

    // Clean up the project
    try {
      await k8sClient.deleteNamespace(projectName);
    } catch (error) {
      // Ignore if already deleted
    }
  });

  test(`creates, displays, modifies, and deletes a new ${crd} instance`, async ({ page }) => {
    await test.step('Navigate to CRD instances page', async () => {
      await navigateToCRDInstancesViaDetails(page, crd);
    });

    await test.step('Create ConsoleExternalLogLink instance via YAML editor', async () => {
      await createCustomResourceViaYaml(page, crdObj);
    });

    await test.step('Verify instance appears on details page', async () => {
      // YAML save redirects to the created resource — no goto needed
      await expect(page.getByRole('heading', { name })).toBeVisible();
    });

    await test.step('Create Pod with matching label in test namespace', async () => {
      await page.goto(`/k8s/ns/${projectName}/pods`);
      await page.getByTestId('item-create').click();

      await waitForYamlEditor(page);
      await replaceYamlEditorContent(page, podObj);
      await page.getByTestId('save-changes').click();

      // Verify no YAML errors
      await expect(page.getByTestId('yaml-error')).toBeHidden();

      // Verify we're redirected to the pod details page
      await expect(page.getByRole('heading', { name: podName })).toBeVisible({ timeout: 30000 });
    });

    await test.step('Verify external log link appears on Pod logs page', async () => {
      await page.goto(`/k8s/ns/${projectName}/pods/${podName}/logs`);

      // Wait for logs page to load
      await expect(page.getByTestId('resource-log-toolbar')).toBeVisible();

      // The external log link is fetched asynchronously when the logs page mounts
      await expect(page.getByTestId(name)).toBeVisible({ timeout: 10000 });
    });

    await test.step('Add namespaceFilter to ConsoleExternalLogLink', async () => {
      await page.goto(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}/yaml`);

      await updateCustomResourceViaYaml(page, (obj) => {
        obj.spec.namespaceFilter = '^openshift-';
        return obj;
      });
    });

    await test.step('Verify external log link is filtered out by namespaceFilter', async () => {
      await page.goto(`/k8s/ns/${projectName}/pods/${podName}/logs`);

      // Wait for logs page to load
      await expect(page.getByTestId('resource-log-toolbar')).toBeVisible();

      // Verify the external log link does NOT appear (filtered out)
      await expect(page.getByTestId(name)).toBeHidden();
    });

    await test.step('Delete the Pod', async () => {
      await k8sClient.deletePod(podName, projectName);

      // Verify deletion by checking the pod is gone
      await page.goto(`/k8s/ns/${projectName}/pods`);
      const podRow = page.getByRole('row', { name: new RegExp(podName) });
      await expect(podRow).not.toBeVisible({ timeout: 10000 });
    });

    await test.step('Delete the ConsoleExternalLogLink instance', async () => {
      await deleteCustomResourceAndVerify(
        page,
        k8sClient,
        'console.openshift.io',
        'v1',
        '',
        'consoleexternalloglinks',
        name,
        crd,
      );
    });
  });
});
