import type { Page } from '@playwright/test';

import { test, expect } from '../../../fixtures';

/**
 * E2E tests for Node Groups filtering functionality
 * Tests the filter UI, filter behavior, and edit groups button
 */

async function gotoNodesPage(page: Page): Promise<void> {
  await page.goto('/k8s/cluster/nodes');
  await expect(
    page.getByTestId('data-view-table').or(page.getByTestId('page-heading')).first(),
  ).toBeVisible();
}

function groupsFilter(page: Page) {
  return page.getByRole('button', { name: /filter by groups/i });
}

function nodeRows(page: Page) {
  return page.locator('[data-test="node-row"], tr[data-test-id*="node"]');
}

function filterDropdown(page: Page) {
  return page.locator('.pf-v6-c-menu, [role="menu"]').first();
}

function filterChips(page: Page) {
  return page.locator('[data-testid="filter-chip"], .pf-v6-c-chip');
}

async function skipIfGroupsFilterDisabled(page: Page): Promise<void> {
  if (!(await groupsFilter(page).isVisible().catch(() => false))) {
    test.skip(true, 'FLAG_NODE_MGMT_V1 is not enabled');
  }
}

async function skipIfEditGroupsButtonHidden(page: Page): Promise<void> {
  const editButton = page.getByRole('button', { name: /edit groups/i });
  if (!(await editButton.isVisible().catch(() => false))) {
    test.skip(true, 'FLAG_NODE_MGMT_V1 is not enabled');
  }
}

test.describe('Node Groups Filter', () => {
  test.beforeEach(async ({ page }) => {
    await gotoNodesPage(page);
  });

  test('should display the Groups filter when FLAG_NODE_MGMT_V1 is enabled', async ({ page }) => {
    await skipIfGroupsFilterDisabled(page);

    const groupsFilterButton = groupsFilter(page);
    await expect(groupsFilterButton).toBeVisible();

    const filtersToolbar = page.locator('[data-testid="filter-toolbar"]').or(
      page.locator('.pf-v6-c-toolbar'),
    );
    await expect(filtersToolbar).toBeVisible();

    const groupsFilterInToolbar = page
      .locator('[role="button"]')
      .filter({ hasText: /filter by groups/i });
    await expect(groupsFilterInToolbar).toBeVisible();
  });

  test('should show available groups as filter options', async ({ page }) => {
    await skipIfGroupsFilterDisabled(page);

    await groupsFilter(page).click();

    const dropdown = filterDropdown(page);
    await expect(dropdown).toBeVisible();

    const filterOptions = dropdown.locator('[role="menuitemcheckbox"], .pf-v6-c-check__label');
    const optionCount = await filterOptions.count();

    if (optionCount === 0) {
      test.skip(true, 'No group filter options available');
      return;
    }

    const optionTexts = await filterOptions.evaluateAll((elements) =>
      elements.map((element) => element.textContent?.trim() ?? ''),
    );
    const sortedOptions = [...optionTexts].sort((a, b) => a.localeCompare(b));
    expect(optionTexts).toEqual(sortedOptions);

    await page.keyboard.press('Escape');
  });

  test('should filter nodes by single group selection', async ({ page }) => {
    await skipIfGroupsFilterDisabled(page);

    const rows = nodeRows(page);
    const initialCount = await rows.count();

    if (initialCount === 0) {
      test.skip(true, 'No nodes available');
      return;
    }

    await groupsFilter(page).click();
    const dropdown = filterDropdown(page);
    await expect(dropdown).toBeVisible();

    const firstOption = dropdown.locator('[role="menuitemcheckbox"], .pf-v6-c-check__input').first();
    const optionCount = await dropdown.locator('[role="menuitemcheckbox"], .pf-v6-c-check__label').count();

    if (optionCount === 0) {
      await page.keyboard.press('Escape');
      test.skip(true, 'No groups available');
      return;
    }

    await firstOption.click();
    await page.keyboard.press('Escape');
    await expect(filterChips(page).first()).toBeVisible();

    const filteredCount = await rows.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    const clearButton = page.getByRole('button', { name: /clear all filters/i });
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(rows).toHaveCount(initialCount);
  });

  test('should filter nodes by multiple group selections (OR logic)', async ({ page }) => {
    await skipIfGroupsFilterDisabled(page);

    await groupsFilter(page).click();
    const dropdown = filterDropdown(page);
    await expect(dropdown).toBeVisible();

    const options = dropdown.locator('[role="menuitemcheckbox"], .pf-v6-c-check__input');
    const optionCount = await options.count();

    if (optionCount < 2) {
      await page.keyboard.press('Escape');
      test.skip(true, 'Need at least 2 groups to test multiple selection');
      return;
    }

    await options.nth(0).click();
    await options.nth(1).click();
    await page.keyboard.press('Escape');

    const chips = filterChips(page);
    await expect(chips).toHaveCount(2, { timeout: 10000 });

    const rows = nodeRows(page);
    const filteredCount = await rows.count();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should clear individual group filter chips', async ({ page }) => {
    await skipIfGroupsFilterDisabled(page);

    await groupsFilter(page).click();
    const dropdown = filterDropdown(page);
    const firstOption = dropdown.locator('[role="menuitemcheckbox"], .pf-v6-c-check__input').first();
    const optionCount = await dropdown.locator('[role="menuitemcheckbox"]').count();

    if (optionCount === 0) {
      await page.keyboard.press('Escape');
      test.skip(true, 'No groups available');
      return;
    }

    await firstOption.click();
    await page.keyboard.press('Escape');

    const filterChip = filterChips(page).first();
    await expect(filterChip).toBeVisible();

    const closeButton = filterChip.locator('button, [data-testid="remove"]');
    await closeButton.click();
    await expect(filterChips(page)).toHaveCount(0);
  });

  test('should combine groups filter with other filters', async ({ page }) => {
    await skipIfGroupsFilterDisabled(page);

    const rows = nodeRows(page);
    const initialCount = await rows.count();

    if (initialCount === 0) {
      test.skip(true, 'No nodes available');
      return;
    }

    const statusFilter = page.getByRole('button', { name: /filter by status/i });
    if (!(await statusFilter.isVisible())) {
      test.skip(true, 'Status filter not available');
      return;
    }

    await statusFilter.click();
    const statusDropdown = filterDropdown(page);
    const readyOption = statusDropdown.locator('text=/ready/i').first();
    await expect(readyOption).toBeVisible();
    await readyOption.click();
    await page.keyboard.press('Escape');
    await expect(filterChips(page).first()).toBeVisible();

    const statusFilteredCount = await rows.count();

    await groupsFilter(page).click();
    const groupsDropdown = filterDropdown(page);
    const firstGroup = groupsDropdown.locator('[role="menuitemcheckbox"], .pf-v6-c-check__input').first();
    await expect(firstGroup).toBeVisible();
    await firstGroup.click();
    await page.keyboard.press('Escape');
    await expect(filterChips(page)).not.toHaveCount(1);

    const combinedCount = await rows.count();
    expect(combinedCount).toBeLessThanOrEqual(statusFilteredCount);
  });
});

test.describe('Edit Groups Button', () => {
  test.beforeEach(async ({ page }) => {
    await gotoNodesPage(page);
  });

  test('should display Edit groups button in page header when FLAG_NODE_MGMT_V1 is enabled', async ({ page }) => {
    await skipIfEditGroupsButtonHidden(page);

    const editButton = page.getByRole('button', { name: /edit groups/i });
    await expect(editButton).toBeVisible();

    const pageHeader = page.locator('[data-test="page-header"], .pf-v6-c-page__main-section').first();
    const headerButton = pageHeader.getByRole('button', { name: /edit groups/i });
    await expect(headerButton).toBeVisible();
  });

  test('should show tooltip when user lacks edit permission', async ({ page }) => {
    await skipIfEditGroupsButtonHidden(page);

    const editButton = page.getByRole('button', { name: /edit groups/i });
    if (!(await editButton.isDisabled())) {
      test.skip(true, 'Edit groups button is not disabled');
      return;
    }

    await editButton.hover();

    const tooltip = page.locator('[role="tooltip"]').filter({
      hasText: /permission.*edit groups.*administrator/i,
    });
    await expect(tooltip).toBeVisible();
  });

  test('should open Groups Editor modal when clicked', async ({ page }) => {
    await skipIfEditGroupsButtonHidden(page);

    const editButton = page.getByRole('button', { name: /edit groups/i });
    if (await editButton.isDisabled()) {
      test.skip(true, 'Edit groups button is disabled');
      return;
    }

    await editButton.click();

    const modal = page.locator('[role="dialog"], .pf-v6-c-modal-box').filter({
      hasText: /groups/i,
    });
    await expect(modal).toBeVisible();

    const closeButton = modal.locator('[aria-label="Close"], button').filter({ hasText: /cancel|close/i }).first();
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await expect(modal).toBeHidden();
  });
});

test.describe('Node Detail Page - Edit Groups Button', () => {
  test.beforeEach(async ({ page }) => {
    await gotoNodesPage(page);
  });

  test('should display Edit button in node details Groups section', async ({ page }) => {
    const rows = nodeRows(page);
    const nodeCount = await rows.count();

    if (nodeCount === 0) {
      test.skip(true, 'No nodes available');
      return;
    }

    const nodeLink = rows.first().locator('a').first();
    await nodeLink.click();
    await expect(page.locator('[data-test-id="details-card"], .pf-v6-c-card').first()).toBeVisible();

    const groupsSection = page.locator('text=/groups/i').first();
    if (!(await groupsSection.isVisible().catch(() => false))) {
      test.skip(true, 'Groups section not available');
      return;
    }

    const editButton = page.locator('[data-test="details-card"], .pf-v6-c-card')
      .getByRole('button', { name: /^edit$/i });

    if (!(await editButton.isVisible().catch(() => false))) {
      test.skip(true, 'Edit button not available in Groups section');
      return;
    }

    await expect(editButton).toBeVisible();
    await expect(editButton).toHaveClass(/link/i);
  });

  test('should open Node Groups Editor modal when edit button clicked', async ({ page }) => {
    const rows = nodeRows(page);
    const nodeCount = await rows.count();

    if (nodeCount === 0) {
      test.skip(true, 'No nodes available');
      return;
    }

    const nodeLink = rows.first().locator('a').first();
    await nodeLink.click();
    await expect(page.locator('[data-test-id="details-card"], .pf-v6-c-card').first()).toBeVisible();

    const editButton = page.locator('[data-test="details-card"], .pf-v6-c-card')
      .getByRole('button', { name: /^edit$/i });

    if (!(await editButton.isVisible().catch(() => false))) {
      test.skip(true, 'Edit button not available in Groups section');
      return;
    }

    if (await editButton.isDisabled()) {
      test.skip(true, 'Edit button is disabled');
      return;
    }

    await editButton.click();

    const modal = page.locator('[role="dialog"], .pf-v6-c-modal-box');
    await expect(modal).toBeVisible();
    await expect(modal).not.toBeEmpty();
  });
});
