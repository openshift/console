import type { Page } from '@playwright/test';
import { test, expect } from '../../../fixtures';
import { testA11y } from '../../../utils/a11y';

type RouteConfig = {
  path: string;
  assertLoaded?: (page: Page) => Promise<void>;
};

async function assertLoadedListPage(page: Page): Promise<void> {
  await expect(
    page.getByTestId('data-view-table').or(page.getByTestId('page-heading')).first(),
  ).toBeVisible();
}

const routes: RouteConfig[] = [
  {
    path: '/',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('page-heading').locator('h1')).toBeAttached();
      for (const skeleton of await page.getByTestId('skeleton-chart').all()) {
        await expect(skeleton).toBeHidden();
      }
    },
  },
  {
    path: '/k8s/cluster/clusterroles/view',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('page-heading').locator('h1')).toBeAttached();
    },
  },
  {
    path: '/k8s/cluster/nodes',
    assertLoaded: assertLoadedListPage,
  },
  {
    path: '/k8s/all-namespaces/events',
    assertLoaded: async (page) => {
      await expect(page.getByRole('row').first()).toBeVisible();
    },
  },
  {
    path: '/k8s/all-namespaces/import',
    assertLoaded: async (page) => {
      await expect(page.getByRole('textbox')).toBeVisible();
    },
  },
  {
    path: '/api-explorer',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('data-view-table')).toBeVisible();
    },
  },
  {
    path: '/api-resource/ns/default/core~v1~Pod',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('page-heading')).toBeVisible();
    },
  },
  {
    path: '/api-resource/ns/default/core~v1~Pod/schema',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('resource-sidebar-item').first()).toBeAttached();
    },
  },
  {
    path: '/api-resource/ns/default/core~v1~Pod/instances',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('api-explorer-resource-title')).toContainText('Pod');
    },
  },
  {
    path: '/api-resource/ns/default/core~v1~Pod/access',
    assertLoaded: async (page) => {
      await expect(
        page.locator('[data-ouia-component-type$="TableRow"]').first(),
      ).toBeVisible();
    },
  },
  {
    path: '/k8s/cluster/user.openshift.io~v1~User',
  },
  {
    path: '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~Machine',
    assertLoaded: assertLoadedListPage,
  },
  {
    path: '/k8s/cluster/machine.openshift.io~v1~ControlPlaneMachineSet',
    assertLoaded: assertLoadedListPage,
  },
  {
    path: '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~MachineSet',
    assertLoaded: assertLoadedListPage,
  },
  {
    path: '/k8s/ns/openshift-machine-api/autoscaling.openshift.io~v1beta1~MachineAutoscaler',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('empty-box-body')).toBeVisible();
    },
  },
  {
    path: '/k8s/ns/openshift-machine-api/machine.openshift.io~v1beta1~MachineHealthCheck',
    assertLoaded: assertLoadedListPage,
  },
  {
    path: '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig',
    assertLoaded: assertLoadedListPage,
  },
  {
    path: '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfigPool',
    assertLoaded: assertLoadedListPage,
  },
  {
    path: '/k8s/all-namespaces/monitoring.coreos.com~v1~Alertmanager',
    assertLoaded: assertLoadedListPage,
  },
  {
    path: '/k8s/ns/openshift-monitoring/monitoring.coreos.com~v1~Alertmanager/main',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('resource-title')).toBeVisible();
    },
  },
  {
    path: '/settings/cluster',
    assertLoaded: async (page) => {
      await expect(page.getByTestId('cluster-version')).toBeAttached();
    },
  },
  {
    path: '/search/all-namespaces?kind=config.openshift.io~v1~Console',
    assertLoaded: assertLoadedListPage,
  },
];

test.describe('Visiting other routes', { tag: ['@admin', '@smoke'] }, () => {
  for (const route of routes) {
    test(`successfully displays view for route: ${route.path.replace(/\//g, ' ')}`, async ({
      page,
    }) => {
      await page.goto(route.path, { timeout: 90_000 });
      await expect(page).toHaveURL(new RegExp(route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      await expect(page.getByTestId('loading-indicator')).toHaveCount(0);
      await expect(page.getByTestId('error-page')).not.toBeAttached();

      if (route.assertLoaded) {
        await route.assertLoaded(page);
      }

      await testA11y(page, `route ${route.path.replace(/\//g, ' ')}`);
    });
  }
});

test.describe('Perspective query parameters', { tag: ['@admin'] }, () => {
  test('Developer query parameter switches to Developer perspective', async ({
    page,
    k8sClient,
  }) => {
    await test.step('Ensure Developer perspective is available', async () => {
      await page.goto('/k8s/cluster/projects');

      const toggle = page.getByTestId('perspective-switcher-toggle');
      await expect(toggle).toBeVisible();

      const isSinglePerspective =
        (await toggle.getAttribute('id')) === 'core-platform-perspective';
      if (isSinglePerspective) {
        await k8sClient.customObjectsApi.patchClusterCustomObject({
          group: 'operator.openshift.io',
          version: 'v1',
          plural: 'consoles',
          name: 'cluster',
          body: [
            {
              op: 'add',
              path: '/spec/customization/perspectives',
              value: [{ id: 'dev', visibility: { state: 'Enabled' } }],
            },
          ],
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
      }
    });

    await test.step('Navigate with perspective=dev and verify', async () => {
      await page.goto('/topology/all-namespaces?view=graph&perspective=dev');
      const toggleText = page
        .getByTestId('perspective-switcher-toggle')
        .locator('.pf-v6-c-menu-toggle__text');
      await expect(toggleText).toContainText('Developer');
    });
  });

  test('Administrator query parameter switches to Administrator perspective', async ({
    page,
  }) => {
    await test.step('Switch to Developer perspective first', async () => {
      await page.goto('/k8s/cluster/projects');

      const toggle = page.getByTestId('perspective-switcher-toggle');
      await toggle.click();

      const devOption = page
        .getByTestId('perspective-switcher-menu-option')
        .filter({ hasText: 'Developer' });
      await devOption.click();

      const toggleText = page
        .getByTestId('perspective-switcher-toggle')
        .locator('.pf-v6-c-menu-toggle__text');
      await expect(toggleText).toContainText('Developer');
    });

    await test.step('Navigate with perspective=admin and verify', async () => {
      await page.goto('/dashboards?perspective=admin');
      const toggleText = page
        .getByTestId('perspective-switcher-toggle')
        .locator('.pf-v6-c-menu-toggle__text');
      await expect(toggleText).toContainText('Core platform');
    });
  });
});
