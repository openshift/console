import yaml from 'js-yaml';

import { test, expect } from '../../../fixtures';
import { getEditorContent, setEditorContent } from '../../../pages/base-page';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { testA11y } from '../../../utils/a11y';
import { testI18n } from '../../../utils/i18n';
import { generateTestName } from '../../../utils/test-name';

type ResourceDefinition = {
  resource: string;
  kind: string;
  namespaced: boolean;
  humanizeKind: boolean;
  skipYamlReloadTest: boolean;
  skipYamlSaveTest: boolean;
};

function actionOnKind(action: string, kind: string, humanizeKind: boolean): string {
  if (!humanizeKind) {
    return `${action} ${kind}`;
  }
  const humanizedKind = (kind.includes('~') ? kind.split('~')[2] : kind)
    .split(/(?=[A-Z])/)
    .join(' ');
  return `${action} ${humanizedKind}`;
}

const editKind = (kind: string, humanizeKind: boolean) => actionOnKind('Edit', kind, humanizeKind);
const deleteKind = (kind: string, humanizeKind: boolean) =>
  actionOnKind('Delete', kind, humanizeKind);

const RESOURCES_WITH_CREATION_FORM = new Set([
  'StorageClass',
  'PersistentVolumeClaim',
  'snapshot.storage.k8s.io~v1~VolumeSnapshot',
]);

const RESOURCES_WITH_SYNCED_EDITOR = new Set([
  'ConfigMap',
  'DeploymentConfig',
  'Deployment',
  'BuildConfig',
]);

const k8sResources: ResourceDefinition[] = [
  { resource: 'pods', kind: 'Pod', namespaced: true, humanizeKind: true, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'serviceaccounts', kind: 'ServiceAccount', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'secrets', kind: 'Secret', namespaced: true, humanizeKind: true, skipYamlReloadTest: true, skipYamlSaveTest: false },
  { resource: 'persistentvolumes', kind: 'PersistentVolume', namespaced: false, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'storageclasses', kind: 'StorageClass', namespaced: false, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'cronjobs', kind: 'CronJob', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'jobs', kind: 'Job', namespaced: true, humanizeKind: true, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'daemonsets', kind: 'DaemonSet', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'deployments', kind: 'Deployment', namespaced: true, humanizeKind: true, skipYamlReloadTest: true, skipYamlSaveTest: true },
  { resource: 'replicasets', kind: 'ReplicaSet', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'replicationcontrollers', kind: 'ReplicationController', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'persistentvolumeclaims', kind: 'PersistentVolumeClaim', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'statefulsets', kind: 'StatefulSet', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'resourcequotas', kind: 'ResourceQuota', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'limitranges', kind: 'LimitRange', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'horizontalpodautoscalers', kind: 'HorizontalPodAutoscaler', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'roles', kind: 'Role', namespaced: true, humanizeKind: true, skipYamlReloadTest: false, skipYamlSaveTest: false },
];

const openshiftResources: ResourceDefinition[] = [
  { resource: 'deploymentconfigs', kind: 'DeploymentConfig', namespaced: true, humanizeKind: false, skipYamlReloadTest: true, skipYamlSaveTest: true },
  { resource: 'buildconfigs', kind: 'BuildConfig', namespaced: true, humanizeKind: false, skipYamlReloadTest: true, skipYamlSaveTest: true },
  { resource: 'imagestreams', kind: 'ImageStream', namespaced: true, humanizeKind: false, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'user.openshift.io~v1~Group', kind: 'user.openshift.io~v1~Group', namespaced: false, humanizeKind: true, skipYamlReloadTest: false, skipYamlSaveTest: false },
];

const snapshotResources: ResourceDefinition[] = [
  { resource: 'snapshot.storage.k8s.io~v1~VolumeSnapshot', kind: 'snapshot.storage.k8s.io~v1~VolumeSnapshot', namespaced: true, humanizeKind: true, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'snapshot.storage.k8s.io~v1~VolumeSnapshotClass', kind: 'snapshot.storage.k8s.io~v1~VolumeSnapshotClass', namespaced: false, humanizeKind: true, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'snapshot.storage.k8s.io~v1~VolumeSnapshotContent', kind: 'snapshot.storage.k8s.io~v1~VolumeSnapshotContent', namespaced: false, humanizeKind: true, skipYamlReloadTest: false, skipYamlSaveTest: false },
  { resource: 'storage.k8s.io~v1~VolumeAttributesClass', kind: 'storage.k8s.io~v1~VolumeAttributesClass', namespaced: false, humanizeKind: true, skipYamlReloadTest: false, skipYamlSaveTest: false },
];

function buildResourceList(): ResourceDefinition[] {
  const isAws = String(process.env.BRIDGE_AWS).toLowerCase() === 'true';
  const resources = [...k8sResources];
  if (isAws) {
    resources.push(...snapshotResources);
  }
  resources.push(...openshiftResources);
  return resources;
}

function getSpecialYamlOverrides(kind: string, name: string): Record<string, unknown> {
  switch (kind) {
    case 'DeploymentConfig':
      return {
        spec: {
          selector: { app: name },
          template: { metadata: { labels: { app: name } } },
        },
      };
    case 'BuildConfig':
      return {
        spec: {
          strategy: {
            type: 'Source',
            sourceStrategy: {
              from: {
                kind: 'ImageStreamTag',
                namespace: 'aut-form-edit-build-config',
                name: 'nodejs-ex-git:latest',
              },
            },
          },
          source: {
            type: 'Git',
            git: { uri: 'https://github.com/sclorg/nodejs-ex.git' },
            contextDir: '/',
          },
        },
      };
    default:
      return {};
  }
}

function deepDefaults(
  target: Record<string, unknown>,
  ...sources: Record<string, unknown>[]
): Record<string, unknown> {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        target[key] = deepDefaults(
          { ...(target[key] as Record<string, unknown>) },
          source[key] as Record<string, unknown>,
        );
      } else if (!(key in target)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

const testLabel = 'automated-test-name';

async function assertNamespaceDropdown(
  listPage: ListPage,
  namespaced: boolean,
  namespace: string,
): Promise<void> {
  const dropdown = listPage.getNamespaceDropdown();
  if (namespaced) {
    await expect(dropdown).toBeAttached();
    await expect(dropdown).toContainText(namespace);
  } else {
    await expect(dropdown).not.toBeAttached();
  }
}

async function assertRowVisible(listPage: ListPage, name: string): Promise<void> {
  await expect(listPage.getCell(name)).toBeVisible();
}

async function assertTableVisible(listPage: ListPage): Promise<void> {
  await expect(listPage.getDataViewTable()).toBeVisible({ timeout: 60_000 });
}

async function assertRowCount(listPage: ListPage, count: number): Promise<void> {
  await expect(listPage.getDataViewTable().locator('tbody tr')).toHaveCount(count);
}

async function assertResourceDeleted(listPage: ListPage, name: string): Promise<void> {
  await expect(listPage.getCell(name)).not.toBeAttached({ timeout: 90_000 });
}

test.describe('Kubernetes resource CRUD operations', { tag: ['@admin'] }, () => {
  test.describe.configure({ mode: 'parallel' });

  const allResources = buildResourceList();

  for (const resourceDef of allResources) {
    const {
      resource,
      kind,
      namespaced,
      humanizeKind,
      skipYamlReloadTest,
      skipYamlSaveTest,
    } = resourceDef;

    test(`${kind} CRUD lifecycle`, async ({ page, k8sClient, cleanup }) => {
      const testName = generateTestName();
      const namespace = `${testName}-crud`;
      const kebabCase = kind
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[~.]/g, '-')
        .toLowerCase();
      const name = `${namespace}-${kebabCase}`;
      const listPage = new ListPage(page);
      const detailsPage = new DetailsPage(page);
      const yamlEditor = new YamlEditorPage(page);
      const modal = new ModalPage(page);

      if (namespaced) {
        await k8sClient.createNamespace(namespace);
        await k8sClient.waitForNamespaceReady(namespace);
        cleanup.trackNamespace(namespace);
      }

      const basePath = namespaced ? `/k8s/ns/${namespace}` : '/k8s/cluster';

      await test.step('Create resource via YAML editor', async () => {
        await page.goto(`${basePath}/${resource}`);

        if (kind === 'Secret') {
          await listPage.clickCreateYAMLDropdownButton();
        } else {
          await listPage.clickCreateButton();
        }

        if (RESOURCES_WITH_CREATION_FORM.has(kind)) {
          await page.getByTestId('yaml-link').click();
        }
        if (RESOURCES_WITH_SYNCED_EDITOR.has(kind)) {
          await page.getByTestId('yaml-view-input').click();
        }

        await yamlEditor.waitForSidebarLoaded();
        await yamlEditor.waitForEditorReady();
        await testA11y(page, `YAML Editor for ${kind}: ${name}`);

        const content = await getEditorContent(page);
        const parsed = yaml.load(content) as Record<string, unknown>;
        const overrides: Record<string, unknown> = {
          metadata: { name, labels: { [testLabel]: namespace } },
          ...getSpecialYamlOverrides(kind, name),
        };
        const merged = deepDefaults({ ...overrides }, parsed);
        await setEditorContent(page, yaml.dump(merged, { sortKeys: true }));

        await yamlEditor.clickSave();
        await expect(yamlEditor.getYamlError()).not.toBeAttached();
        await expect(detailsPage.getPageHeading()).toContainText(name);
      });

      await test.step('View details page', async () => {
        await page.goto(`${basePath}/${resource}/${name}`);
        await expect(detailsPage.getPageHeading()).toContainText(name);
        await testA11y(page, `Details page for ${kind}: ${name}`);
        await testI18n(page, [
          '.pf-v6-c-tabs__item',
          '[data-test-section-heading]',
          'dt',
        ]);
      });

      await test.step('View list page', async () => {
        await page.goto(`${basePath}/${resource}`);

        await assertNamespaceDropdown(listPage, namespaced, namespace);
        await assertTableVisible(listPage);
        await testA11y(page, `List page for ${kind}: ${name}`);
        await testI18n(page, ['.co-m-list th'], ['item-create']);
      });

      await test.step('Search view displays resource', async () => {
        const searchPath = namespaced ? `ns/${namespace}` : 'all-namespaces';
        await page.goto(
          `/search/${searchPath}?kind=${kind}&q=${testLabel}%3d${namespace}&name=${name}`,
        );

        await assertRowVisible(listPage, name);
        await testA11y(page, `Search page for ${kind}: ${name}`);

        await listPage.clickRowByName(name);
        await expect(page).toHaveURL(new RegExp(`/${name}`));
        await expect(detailsPage.getPageHeading()).toContainText(name);
      });

      await test.step('Edit resource via kebab action', async () => {
        const searchPath = namespaced ? `ns/${namespace}` : 'all-namespaces';
        await page.goto(
          `/search/${searchPath}?kind=${kind}&q=${testLabel}%3d${namespace}&name=${name}`,
        );

        const editAction = editKind(kind, humanizeKind);
        await listPage.clickKebabAction(name, editAction);

        if (!skipYamlReloadTest) {
          await yamlEditor.waitForEditorReady();
          await yamlEditor.clickReload();
        }
        if (!skipYamlSaveTest) {
          await yamlEditor.clickSave();
        }
      });

      await test.step('Delete resource via kebab action', async () => {
        await page.goto(`${basePath}/${resource}`);

        const deleteAction = deleteKind(kind, humanizeKind);
        await listPage.filterByName(name);
        await assertRowCount(listPage, 1);
        await listPage.clickKebabAction(name, deleteAction);

        await modal.waitForOpen();
        await modal.submit();
        await modal.waitForClosed();

        await assertResourceDeleted(listPage, name);
      });
    });
  }
});
