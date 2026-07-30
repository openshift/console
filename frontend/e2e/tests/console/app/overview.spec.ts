import { test, expect } from '../../../fixtures';
import { OverviewPage } from '../../../pages/overview-page';

const resourceModels = [
  {
    kind: 'DaemonSet',
    label: 'DaemonSet',
    apiGroup: 'apps',
    apiVersion: 'v1',
    plural: 'daemonsets',
  },
  {
    kind: 'Deployment',
    label: 'Deployment',
    apiGroup: 'apps',
    apiVersion: 'v1',
    plural: 'deployments',
  },
  {
    kind: 'DeploymentConfig',
    label: 'DeploymentConfig',
    apiGroup: 'apps.openshift.io',
    apiVersion: 'v1',
    plural: 'deploymentconfigs',
  },
  {
    kind: 'StatefulSet',
    label: 'StatefulSet',
    apiGroup: 'apps',
    apiVersion: 'v1',
    plural: 'statefulsets',
  },
] as const;

function buildResourceBody(
  kind: string,
  apiGroup: string,
  apiVersion: string,
  name: string,
  namespace: string,
): Record<string, unknown> {
  const apiVersionField = apiGroup ? `${apiGroup}/${apiVersion}` : apiVersion;
  const base = {
    apiVersion: apiVersionField,
    kind,
    metadata: { name, namespace },
    spec: {
      selector: { matchLabels: { app: name } },
      template: {
        metadata: { labels: { app: name } },
        spec: {
          containers: [
            {
              name: 'test',
              image: 'registry.access.redhat.com/ubi9/ubi-minimal:latest',
              command: ['sleep', '3600'],
            },
          ],
        },
      },
    },
  };

  if (kind === 'DaemonSet') {
    return {
      ...base,
      spec: {
        ...base.spec,
        updateStrategy: { type: 'RollingUpdate' },
      },
    };
  }

  if (kind === 'StatefulSet') {
    return {
      ...base,
      spec: {
        ...base.spec,
        serviceName: name,
      },
    };
  }

  if (kind === 'DeploymentConfig') {
    return {
      ...base,
      spec: {
        ...base.spec,
        selector: { app: name },
        replicas: 1,
      },
    };
  }

  if (kind === 'Deployment') {
    return {
      ...base,
      spec: {
        ...base.spec,
        replicas: 1,
      },
    };
  }

  return base;
}

test.describe('Overview page', { tag: ['@admin'] }, () => {
  for (const model of resourceModels) {
    test(`displays ${model.kind} in overview list and shows details sidebar`, async ({
      page,
      k8sClient,
      cleanup,
    }) => {
      const ns = `test-overview-${model.kind.toLowerCase()}-${Date.now()}`;
      const resourceName = `test-${model.kind.toLowerCase()}`;
      const overview = new OverviewPage(page);

      await test.step('Create namespace and resource via API', async () => {
        await k8sClient.createNamespace(ns);
        cleanup.trackNamespace(ns);

        const body = buildResourceBody(
          model.kind,
          model.apiGroup,
          model.apiVersion,
          resourceName,
          ns,
        );
        await k8sClient.createCustomResource(
          model.apiGroup,
          model.apiVersion,
          ns,
          model.plural,
          body,
        );
      });

      await test.step(`Verify ${model.kind} appears in workloads list`, async () => {
        await overview.navigateToWorkloads(ns);
        await expect(overview.listViewLocator).toBeVisible({ timeout: 30_000 });
        await expect(overview.itemRowsLocator.first()).toBeVisible({ timeout: 30_000 });
        await expect(overview.kindLabel(model.label)).toBeVisible();
        await expect(overview.labelCell(resourceName)).toBeVisible();
      });

      await test.step('Click resource and verify details sidebar', async () => {
        await expect(overview.sidebarLocator).not.toBeAttached();
        await overview.clickListItem(resourceName);
        await expect(overview.sidebarLocator).toBeAttached();
        await expect(overview.sidebarHeadingLocator).toContainText(resourceName);
      });
    });
  }
});
