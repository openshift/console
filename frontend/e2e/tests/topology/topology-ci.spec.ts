import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { test, expect } from '../../fixtures';
import { TopologyPage } from '../../pages/topology-page';
import { TopologySidebarPage } from '../../pages/topology-sidebar-page';
import type { Page } from '@playwright/test';

const NS = `aut-topology-ci-${Date.now()}`;

const MOCK_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'testData',
);
const repoMock = JSON.parse(fs.readFileSync(path.join(MOCK_DIR, 'repo.json'), 'utf-8'));
const contentsMock = JSON.parse(fs.readFileSync(path.join(MOCK_DIR, 'contents.json'), 'utf-8'));

// Helper function to mock GitHub API calls
async function mockGitHubApi(page: Page, repoMock: any, contentsMock: any) {
  const apiBase = 'https://api.github.com/repos/redhat-developer/s2i-dotnetcore-ex';
  const escapedApiBase = apiBase.replace(/\//g, '\\/');

  // Mock main repository API call
  await page.route(new RegExp(`${escapedApiBase}(\\?.*)?$`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(repoMock)
    });
  });

  // Mock repository contents API call
  await page.route(new RegExp(`${escapedApiBase}\\/contents\\/?(?:\\?.*)?$`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(contentsMock)
    });
  });

  // Mock package.json file (not found)
  await page.route(new RegExp(`${escapedApiBase}\\/.*package\\.json`), async (route) => {
    await route.fulfill({ status: 404 });
  });

  // Mock devfile API (not found)
  await page.route(/\/api\/devfile\//, async (route) => {
    await route.fulfill({ status: 404 });
  });

  // Mock func.yaml file (not found)
  await page.route(new RegExp(`${escapedApiBase}\\/.*func\\.yaml`), async (route) => {
    await route.fulfill({ status: 404 });
  });
}

// Helper function to create a workload
async function createWorkload(page: Page, workloadName: string) {
  const topology = new TopologyPage(page);
  await page.goto('/');
  await topology.switchPerspective('Administrator');
  await topology.navigateToTopologyGraph(NS);
  
  await test.step('Open quick search and select .NET builder image', async () => {
    await topology.clickStartBuilding();
    await topology.typeInQuickSearch('.NET');
    await topology.clickBuilderImageItem('.NET SDK-Builder Images');
  });
  
  await test.step('Create application from quick search', async () => {
    await topology.selectBuilderImageFromList(/^\.NET SDK.*Builder Images$/);
    await topology.clickCreateButton();
  });
  
  await test.step('Mock GitHub API and fill git repo URL', async () => {
    await mockGitHubApi(page, repoMock, contentsMock);
    await topology.fillGitRepoUrl('https://github.com/redhat-developer/s2i-dotnetcore-ex');
    await topology.waitForGitUrlValidation();
  });
  
  await test.step('Enter application and workload names', async () => {
    await topology.fillApplicationName(`${workloadName}-app`);
    await topology.fillWorkloadName(workloadName);
  });
  
  await test.step('Select Deployment resource type and submit', async () => {
    await topology.selectResourceType('kubernetes');
    await topology.clickSaveChanges();
  });
  
  await test.step('Verify workload appears in topology', async () => {
    // Wait for the workload to be visible with a longer timeout
    await topology.verifyWorkloadVisible(workloadName, 120_000);
  });
}

// Helper function to delete a workload
async function deleteWorkload(page: Page, workloadName: string) {
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
      await topology.closeSidebarIfOpen();
    });
    
    await test.step('Right-click workload and select Edit', async () => {
      await topology.rightClickOnNode('dotnet-edit-test');
      await topology.selectContextMenuAction('Edit dotnet-edit-test');
    });
    
    await test.step('Change application groupings to "app"', async () => {
      await topology.clickApplicationDropdown();
      await topology.selectFirstApplicationOption();
      await topology.fillApplicationName('app');
      await topology.clickSaveChanges();
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
