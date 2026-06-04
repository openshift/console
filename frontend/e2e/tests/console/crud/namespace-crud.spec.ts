import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { Navigation } from '../../../pages/navigation';
import { testA11y } from '../../../utils/a11y';
import { generateTestName } from '../../../utils/test-name';

test.describe('Namespace', { tag: ['@admin'] }, () => {
  test('lists, creates, and deletes', async ({ page, k8sClient, cleanup }) => {
    const testName = generateTestName();
    const testNamespace = `${testName}-ns`;
    const newNamespace = `${testNamespace}-new`;
    const nav = new Navigation(page);
    const listPage = new ListPage(page);
    const modal = new ModalPage(page);

    await k8sClient.createNamespace(testNamespace);
    await k8sClient.waitForNamespaceReady(testNamespace);
    cleanup.trackNamespace(testNamespace);
    cleanup.trackNamespace(newNamespace);

    await test.step('Verify Namespace list page', async () => {
      await nav.navigateToAdministration('Namespaces');
      await expect(listPage.getDataViewTable()).toBeVisible({ timeout: 60_000 });
      await listPage.filterByName(testNamespace);
      await expect(listPage.getCell(testNamespace)).toBeVisible();
      await testA11y(page, 'Namespace List page');
    });

    await test.step('Create namespace via modal', async () => {
      await listPage.clickCreateButton();
      await modal.waitForOpen();
      await page.getByTestId('input-name').fill(newNamespace);
      await testA11y(page, 'Create Namespace modal');
      await modal.submit();
      await modal.waitForClosed();
      await expect(page).toHaveURL(new RegExp(`/k8s/cluster/namespaces/${newNamespace}`));
    });

    await test.step('Delete namespace via kebab action', async () => {
      await nav.clickNavLink('Administration', 'Namespaces');
      await listPage.filterByName(newNamespace);
      await expect(listPage.getCell(newNamespace)).toBeVisible();
      await listPage.clickKebabAction(newNamespace, 'Delete Namespace');
      await modal.waitForOpen();
      await page.getByTestId('project-name-input').pressSequentially(newNamespace);
      await testA11y(page, 'Delete Namespace modal');
      await modal.submit();
      await modal.waitForClosed();
    });
  });

  test('Nav and breadcrumbs preserve namespace when navigating between list and details', async ({
    page,
  }) => {
    const allProjects = 'All Projects';
    const nav = new Navigation(page);
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);

    await test.step('Select All Projects on Pods list', async () => {
      await nav.navigateToWorkloads('Pods');
      await listPage.selectProject(allProjects);
      await expect(listPage.getNamespaceDropdown()).toContainText(allProjects);
    });

    const podName = await listPage.getFirstCellText();

    await test.step('Navigating to pod details switches to resource namespace', async () => {
      await listPage.filterByName(podName);
      await listPage.clickRowByName(podName);
      await expect(listPage.getNamespaceDropdown()).not.toContainText(allProjects);
    });

    const podNamespace = await listPage
      .getNamespaceDropdown()
      .textContent()
      .then((text) => text?.replace('Project:', '').trim() ?? '');

    await test.step('Nav link back to list preserves namespace', async () => {
      await nav.clickNavLink('Workloads', 'Pods');
      await expect(listPage.getNamespaceDropdown()).toContainText(podNamespace);
    });

    await test.step('Breadcrumb back to list preserves namespace', async () => {
      await listPage.clickFirstLinkInFirstRow();
      await detailsPage.getBreadcrumb(0).click();
      await expect(listPage.getNamespaceDropdown()).toContainText(podNamespace);
    });
  });

  test('Nav and breadcrumbs restores last selected project when navigating between list and details', async ({
    page,
  }) => {
    const nav = new Navigation(page);
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);
    const projectName = 'default';

    await test.step('Select default project on Secrets list', async () => {
      await nav.navigateToWorkloads('Secrets');
      await listPage.selectProject(projectName);
      await expect(listPage.getNamespaceDropdown()).toContainText(projectName);
    });

    await test.step('Details page preserves project selection', async () => {
      await listPage.clickFirstLinkInFirstRow();
      await expect(listPage.getNamespaceDropdown()).toContainText(projectName);
    });

    await test.step('Nav link back to list preserves project', async () => {
      await nav.clickNavLink('Workloads', 'Secrets');
      await expect(listPage.getNamespaceDropdown()).toContainText(projectName);
    });

    await test.step('Second details visit preserves project', async () => {
      await listPage.clickFirstLinkInFirstRow();
      await expect(listPage.getNamespaceDropdown()).toContainText(projectName);
    });

    await test.step('Breadcrumb back to list preserves project', async () => {
      await detailsPage.getBreadcrumb(0).click();
      await expect(listPage.getNamespaceDropdown()).toContainText(projectName);
    });
  });
});
