import yaml from 'js-yaml';

import { test, expect } from '../../../fixtures';
import { getEditorContent, setEditorContent } from '../../../pages/base-page';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { Navigation } from '../../../pages/navigation';
import { RoleBindingPage } from '../../../pages/role-binding-page';

test.describe('Roles and RoleBindings', { tag: ['@admin'] }, () => {
  test.describe.configure({ mode: 'serial' });
  let namespace: string;
  let roleName: string;
  let clusterRoleName: string;
  let roleBindingName: string;
  let clusterRoleBindingName: string;

  test.beforeAll(async ({ k8sClient }) => {
    const suffix = Date.now();
    namespace = `test-roles-${suffix}`;
    roleName = `test-role-${suffix}`;
    clusterRoleName = `test-clusterrole-${suffix}`;
    roleBindingName = `test-rb-${suffix}`;
    clusterRoleBindingName = `test-crb-${suffix}`;
    await k8sClient.createNamespace(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    const deletions = [
      k8sClient.deleteClusterCustomResource(
        'rbac.authorization.k8s.io',
        'v1',
        'clusterroles',
        clusterRoleName,
      ),
      k8sClient.deleteClusterCustomResource(
        'rbac.authorization.k8s.io',
        'v1',
        'clusterrolebindings',
        clusterRoleBindingName,
      ),
      k8sClient.deleteNamespace(namespace),
    ];
    await Promise.all(deletions);
  });

  test('create Role and ClusterRole via YAML editor', async ({ page }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);

    await test.step('Create Role via YAML editor', async () => {
      await nav.navigateToUserManagement('Roles');
      await listPage.waitForListLoad();
      await listPage.selectProject(namespace);
      await listPage.waitForListLoad();

      await page.getByTestId('item-create').click();
      await page.getByTestId('code-editor').waitFor({ state: 'visible' });

      const content = await getEditorContent(page);
      const parsed = yaml.load(content) as Record<string, any>;
      parsed.metadata.name = roleName;
      await setEditorContent(page, yaml.dump(parsed));

      await page.getByTestId('save-changes').click();
      await expect(page.getByTestId('yaml-error')).not.toBeAttached();

      const details = new DetailsPage(page);
      await details.waitForPageLoad();
    });

    await test.step('Navigate back to Roles list', async () => {
      const details = new DetailsPage(page);
      await details.getBreadcrumb(0).click();
      await listPage.waitForListLoad();
    });

    await test.step('Create ClusterRole via YAML editor', async () => {
      await page.getByTestId('item-create').click();
      await page.getByTestId('code-editor').waitFor({ state: 'visible' });

      const content = await getEditorContent(page);
      const parsed = yaml.load(content) as Record<string, any>;
      parsed.kind = 'ClusterRole';
      parsed.metadata = { name: clusterRoleName };
      await setEditorContent(page, yaml.dump(parsed));

      await page.getByTestId('save-changes').click();
      await expect(page.getByTestId('yaml-error')).not.toBeAttached();

      const details = new DetailsPage(page);
      await details.waitForPageLoad();
    });
  });

  test('create RoleBinding and ClusterRoleBinding via form', async ({ page }) => {
    const nav = new Navigation(page);

    await test.step('Create RoleBinding', async () => {
      await nav.navigateToUserManagement('RoleBindings');
      const listPage = new ListPage(page);
      await listPage.waitForListLoad();

      await page.getByTestId('item-create').click();
      await expect(page.getByTestId('title')).toHaveText('Create RoleBinding');

      const rbPage = new RoleBindingPage(page);
      await rbPage.fillName(roleBindingName);
      await rbPage.selectNamespace(namespace);
      await rbPage.selectRole('cluster-admin');
      await rbPage.fillSubjectName('subject-name');
      await rbPage.save();
      await expect(page.getByTestId('yaml-error')).not.toBeAttached();

      const details = new DetailsPage(page);
      await details.waitForPageLoad();
    });

    await test.step('Create ClusterRoleBinding', async () => {
      await nav.navigateToUserManagement('RoleBindings');
      const listPage = new ListPage(page);
      await listPage.waitForListLoad();

      await page.getByTestId('item-create').click();
      await expect(page.getByTestId('title')).toHaveText('Create RoleBinding');

      const rbPage = new RoleBindingPage(page);
      await rbPage.selectClusterRoleBinding();
      await rbPage.fillName(clusterRoleBindingName);
      await rbPage.selectRole('cluster-admin');
      await rbPage.fillSubjectName('subject-name');
      await rbPage.save();
      await expect(page.getByTestId('yaml-error')).not.toBeAttached();

      const details = new DetailsPage(page);
      await details.waitForPageLoad();
    });
  });

  test('displays Resource names and Verbs columns in Role rules table', async ({ page }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);
    const details = new DetailsPage(page);

    await nav.navigateToUserManagement('Roles');
    await listPage.waitForListLoad();
    await listPage.selectProject(namespace);
    await listPage.waitForListLoad();
    await listPage.filterByName(roleName);
    await listPage.clickRowByName(roleName);
    await details.waitForPageLoad();

    await expect(page.locator('th', { hasText: 'Resource names' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Verbs' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Actions' })).not.toBeAttached();
  });

  test('displays Resource names and Verbs columns in ClusterRole rules table', async ({
    page,
  }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);
    const details = new DetailsPage(page);

    await nav.navigateToUserManagement('Roles');
    await listPage.waitForListLoad();
    await listPage.selectAllProjects();
    await listPage.waitForListLoad();
    await listPage.filterByCheckbox('Role', 'cluster');
    await listPage.filterByName(clusterRoleName);
    await listPage.clickRowByName(clusterRoleName);
    await details.waitForPageLoad();

    await expect(page.locator('th', { hasText: 'Resource names' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Verbs' })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Actions' })).not.toBeAttached();
  });

  for (const rolesOrBindings of ['Roles', 'RoleBindings'] as const) {
    test(`${rolesOrBindings} detail breadcrumb to list restores All Projects`, async ({
      page,
    }) => {
      if (rolesOrBindings === 'RoleBindings') {
        test.fixme(true, 'RoleBindings breadcrumb does not restore All Projects dropdown');
      }
      const name = rolesOrBindings === 'Roles' ? roleName : roleBindingName;
      const nav = new Navigation(page);
      const listPage = new ListPage(page);
      const details = new DetailsPage(page);
      const namespaceDropdown = page.getByTestId('namespace-bar-dropdown');

      await nav.navigateToUserManagement(rolesOrBindings);
      await listPage.waitForListLoad();
      await listPage.selectAllProjects();
      await listPage.waitForListLoad();
      await listPage.filterByCheckbox(
        rolesOrBindings === 'Roles' ? 'Role' : 'Kind',
        'namespace',
      );
      await listPage.filterByName(name);
      await listPage.clickRowByName(name);
      await details.waitForPageLoad();

      await expect(namespaceDropdown).toContainText(namespace);

      await details.getBreadcrumb(0).click();
      await listPage.waitForListLoad();
      await expect(namespaceDropdown).toContainText('All Projects');
    });

    test(`${rolesOrBindings} detail breadcrumb to list restores last selected project`, async ({
      page,
    }) => {
      const name = rolesOrBindings === 'Roles' ? roleName : roleBindingName;
      const nav = new Navigation(page);
      const listPage = new ListPage(page);
      const details = new DetailsPage(page);
      const namespaceDropdown = page.getByTestId('namespace-bar-dropdown');

      await nav.navigateToUserManagement(rolesOrBindings);
      await listPage.waitForListLoad();
      await listPage.selectProject(namespace);
      await listPage.waitForListLoad();
      await listPage.filterByCheckbox(
        rolesOrBindings === 'Roles' ? 'Role' : 'Kind',
        'namespace',
      );
      await listPage.filterByName(name);
      await listPage.clickRowByName(name);
      await details.waitForPageLoad();

      await expect(namespaceDropdown).toContainText(namespace);

      await details.getBreadcrumb(0).click();
      await listPage.waitForListLoad();
      await expect(namespaceDropdown).toContainText(namespace);
    });

    test(`Cluster${rolesOrBindings} detail breadcrumb to list restores All Projects`, async ({
      page,
    }) => {
      const clusterName = rolesOrBindings === 'Roles' ? clusterRoleName : clusterRoleBindingName;
      const nav = new Navigation(page);
      const listPage = new ListPage(page);
      const details = new DetailsPage(page);
      const namespaceDropdown = page.getByTestId('namespace-bar-dropdown');

      await nav.navigateToUserManagement(rolesOrBindings);
      await listPage.waitForListLoad();
      await listPage.selectAllProjects();
      await listPage.waitForListLoad();
      await listPage.filterByCheckbox(
        rolesOrBindings === 'Roles' ? 'Role' : 'Kind',
        'cluster',
      );
      await listPage.filterByName(clusterName);
      await listPage.clickRowByName(clusterName);
      await details.waitForPageLoad();

      await expect(namespaceDropdown).not.toBeAttached();

      await details.getBreadcrumb(0).click();
      await listPage.waitForListLoad();
      await expect(namespaceDropdown).toContainText('All Projects');
    });

    test(`Cluster${rolesOrBindings} detail breadcrumb to list restores last selected project`, async ({
      page,
    }) => {
      const clusterName = rolesOrBindings === 'Roles' ? clusterRoleName : clusterRoleBindingName;
      const nav = new Navigation(page);
      const listPage = new ListPage(page);
      const details = new DetailsPage(page);
      const namespaceDropdown = page.getByTestId('namespace-bar-dropdown');

      await nav.navigateToUserManagement(rolesOrBindings);
      await listPage.waitForListLoad();
      await listPage.selectProject(namespace);
      await listPage.waitForListLoad();
      await listPage.filterByCheckbox(
        rolesOrBindings === 'Roles' ? 'Role' : 'Kind',
        'cluster',
      );
      await listPage.filterByName(clusterName);
      await listPage.clickRowByName(clusterName);
      await details.waitForPageLoad();

      await expect(namespaceDropdown).not.toBeAttached();

      await details.getBreadcrumb(0).click();
      await listPage.waitForListLoad();
      await expect(namespaceDropdown).toContainText(namespace);
    });
  }
});
