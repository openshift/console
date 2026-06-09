import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { test, expect } from '../../fixtures';
import { TopologyPage } from '../../pages/topology-page';
import { TopologySidebarPage } from '../../pages/topology-sidebar-page';

const NS = `aut-topology-ci-${Date.now()}`;

const MOCK_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'testData',
);
const repoMock = JSON.parse(fs.readFileSync(path.join(MOCK_DIR, 'repo.json'), 'utf-8'));
const contentsMock = JSON.parse(fs.readFileSync(path.join(MOCK_DIR, 'contents.json'), 'utf-8'));

// Helper function to create a workload
async function createWorkload(page: any, workloadName: string) {
  const topology = new TopologyPage(page);
  await page.goto('/');
  await topology.switchPerspective('Administrator');
  await topology.navigateToTopologyGraph(NS);
  
  await test.step('Open quick search and select .NET builder image', async () => {
    await topology.clickStartBuilding();
    await topology.typeInQuickSearch('.NET');
    await page.getByTestId('item-name-.NET SDK-Builder Images').first().click();
  });
  
  await test.step('Create application from quick search', async () => {
    await expect(page.getByRole('progressbar')).not.toBeAttached({ timeout: 60_000 });
    await page
    .getByRole('listitem')
    .filter({ hasText: /^\.NET SDK.*Builder Images$/ })
    .first()
    .click();
    await page.getByRole('button', { name: 'Create' }).click();
  });
  
  await test.step('Mock GitHub API and fill git repo URL', async () => {
    const apiBase = 'https://api.github.com/repos/redhat-developer/s2i-dotnetcore-ex';
    await page.route(new RegExp(`${apiBase.replace(/\//g, '\\/')}(\\?.*)?$`), async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(repoMock) });
    });
    await page.route(new RegExp(`${apiBase.replace(/\//g, '\\/')}\/contents\\/?(\\?.*)?$`), async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(contentsMock) });
    });
    await page.route(new RegExp(`${apiBase.replace(/\//g, '\\/')}\/.*package\\.json`), async (route) => {
      await route.fulfill({ status: 404 });
    });
    await page.route(/\/api\/devfile\//, async (route) => {
      await route.fulfill({ status: 404 });
    });
    await page.route(new RegExp(`${apiBase.replace(/\//g, '\\/')}\/.*func\\.yaml`), async (route) => {
      await route.fulfill({ status: 404 });
    });
    
    await page.getByLabel('Git Repo URL').clear();
    await page.getByLabel('Git Repo URL').fill('https://github.com/redhat-developer/s2i-dotnetcore-ex');
    await expect(page.locator('#form-input-git-url-field-helper')).toContainText('Validated', {
      timeout: 120_000,
    });
  });
  
  await test.step('Enter application and workload names', async () => {
    await page.locator('#form-input-application-name-field').fill(`${workloadName}-app`);
    await page.locator('#form-input-name-field').fill(workloadName);
  });
  
  await test.step('Select Deployment resource type and submit', async () => {
    await page.locator('#form-select-input-resources-field').scrollIntoViewIfNeeded();
    await page.locator('#form-select-input-resources-field').click();
    await page.locator('#select-option-resources-kubernetes').click();
    await page.getByTestId('save-changes').click();
  });
  
  await test.step('Verify workload appears in topology', async () => {
    await topology.verifyWorkloadVisible(workloadName, 60_000);
  });
}

// Helper function to delete a workload
async function deleteWorkload(page: any, workloadName: string) {
  const topology = new TopologyPage(page);
  const sidebar = new TopologySidebarPage(page);
  
  await topology.clickOnNode(workloadName);
  await sidebar.verify();
  await sidebar.selectAction('Delete Deployment');
  await topology.clickConfirmAction();
}

test.describe('Perform actions on topology', { tag: ['@smoke'] }, () => {
  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(NS);
    await k8sClient.waitForNamespaceReady(NS);
  });
  
  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(NS);
  });
  
  test('empty state of topology: T-06-TC01', async ({ page }) => {
    const topology = new TopologyPage(page);
    await page.goto('/');
    await topology.switchPerspective('Administrator');
    await topology.navigateToTopology(NS);
    
    await test.step('Verify empty state message and links', async () => {
      await expect(topology.getNoResourcesFound()).toBeVisible({ timeout: 30_000 });
      await expect(topology.getStartBuildingLink()).toBeVisible();
      await expect(topology.getAddPageLink()).toBeVisible();
    });
    
    await test.step('Verify controls are disabled', async () => {
      await expect(topology.getDisplayOptionsButton()).toBeDisabled();
      await expect(topology.getFilterByResourceDropdown()).toBeDisabled();
      await expect(topology.getSearchInput()).toBeDisabled();
      await expect(topology.getSwitcher()).toBeDisabled();
    });
  });
  
  test('Build the application from topology page', async ({ page }) => {
    const topology = new TopologyPage(page);
    await createWorkload(page, 'dotnet-build-test');
    
    await test.step('Clean up: Delete workload', async () => {
      await deleteWorkload(page, 'dotnet-build-test');
      await expect(topology.getNoResourcesFound()).toBeVisible({ timeout: 60_000 });
    });
  });
  
  test('Edit workload application groupings: T-09-TC01', async ({ page }) => {
    const topology = new TopologyPage(page);
    await createWorkload(page, 'dotnet-edit-test');
    
    await test.step('Prepare for right-click: clear search and close any sidebar', async () => {
      // Clear the search field to avoid interference
      await topology.search('');
      // Close sidebar if open
      const sidebarCloseButton = page.getByTestId('sidebar-close-button');
      if (await sidebarCloseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sidebarCloseButton.click();
      }
    });
    
    await test.step('Right-click workload and select Edit', async () => {
      await topology.rightClickOnNode('dotnet-edit-test');
      await topology.selectContextMenuAction('Edit dotnet-edit-test');
    });
    
    await test.step('Change application groupings to "app"', async () => {
      const appDropdown = page.locator('[id$="application-name-field"]');
      await expect(appDropdown).toBeVisible({ timeout: 30_000 });
      await appDropdown.click();
      await page.getByTestId('console-select-item').first().click();
      const appInput = page.getByTestId('application-form-app-input');
      
      await expect(appInput).toBeVisible();
      await appInput.fill('app');
      await expect(appInput).toHaveValue('app');

      await page.getByTestId('save-changes').click();
    });
    
    await test.step('Verify application grouping changed', async () => {
      
      // Verify the workload still exists
      await topology.verifyWorkloadVisible('dotnet-edit-test', 60_000);
      await topology.verifyGroupLabel('dotnet-edit-test', 'app', 5_000);
      
      await expect(topology.getGraphSurface()).toBeAttached();
    });
    
    await test.step('Clean up: Delete workload', async () => {
      await deleteWorkload(page, 'dotnet-edit-test');
      await expect(topology.getNoResourcesFound()).toBeVisible({ timeout: 60_000 });
    });
  });
  
  test('Default state of Display dropdown: T-16-TC01', async ({ page }) => {
    const topology = new TopologyPage(page);
    await createWorkload(page, 'dotnet-display-test');
    
    await test.step('Check default display options', async () => {
      await topology.clickDisplayOptions();
      await expect(topology.getExpandToggle()).toBeChecked();
      await expect(topology.getDisplayOptionCheckbox('Pod count')).not.toBeChecked();
      await expect(topology.getDisplayOptionCheckbox('Labels')).toBeChecked();
    });
    
    await test.step('Clean up: Delete workload', async () => {
      await deleteWorkload(page, 'dotnet-display-test');
      await expect(topology.getNoResourcesFound()).toBeVisible({ timeout: 60_000 });
    });
  });
  
  test('Delete workload via Action menu: T-15-TC01', async ({ page }) => {
    const topology = new TopologyPage(page);
    const sidebar = new TopologySidebarPage(page);
    await createWorkload(page, 'dotnet-delete-test');
    
    await test.step('Open sidebar and delete via Actions menu', async () => {
      await topology.clickOnNode('dotnet-delete-test');
      await sidebar.verify();
      await sidebar.selectAction('Delete Deployment');
    });
    
    await test.step('Confirm deletion and verify empty state', async () => {
      await topology.clickConfirmAction();
      await expect(topology.getNoResourcesFound()).toBeVisible({ timeout: 60_000 });
    });
  });
});
