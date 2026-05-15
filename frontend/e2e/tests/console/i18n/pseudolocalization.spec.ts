import type { Page } from '@playwright/test';
import { test, expect } from '../../../fixtures';

const PSEUDO_LOCALIZED_PATTERN = /\[[^a-zA-Z]+\]/;

const dashboardUrl = '/dashboards?pseudolocalization=true&lng=en';

async function collectNonEmptyTexts(page: Page, testId: string): Promise<string[]> {
  const elements = page.getByTestId(testId);
  const count = await elements.count();
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await elements.nth(i).textContent();
    if (text && text.length > 0) {
      texts.push(text);
    }
  }
  return texts;
}

async function expectPseudoLocalized(page: Page, testId: string) {
  const texts = await collectNonEmptyTexts(page, testId);
  expect(texts.length).toBeGreaterThan(0);
  for (const text of texts) {
    expect(text).toMatch(PSEUDO_LOCALIZED_PATTERN);
  }
}

test.describe('Pseudolocalization', { tag: ['@admin'] }, () => {
  test.use({ locale: 'en' });

  test('pseudolocalizes dashboard masthead, activity card, and utilization card', async ({
    page,
  }) => {
    await page.goto(dashboardUrl);
    await page.getByTestId('activity').first().waitFor({ state: 'visible' });

    await test.step('Verify masthead help menu is pseudolocalized', async () => {
      await page.getByTestId('help-dropdown-toggle').click();

      const dropdown = page.getByTestId('help-dropdown');
      const menus = dropdown.locator('ul[role="menu"]');
      await expect(menus).toHaveCount(2);

      const texts = await collectNonEmptyTexts(page, 'application-launcher-item');
      expect(texts.length).toBeGreaterThan(0);
      for (const text of texts) {
        expect(text).toMatch(PSEUDO_LOCALIZED_PATTERN);
      }

      await page.getByTestId('help-dropdown-toggle').click();
    });

    await test.step('Verify activity card is pseudolocalized', async () => {
      await expectPseudoLocalized(page, 'activity');
      await expectPseudoLocalized(page, 'activity-recent-title');
      await expectPseudoLocalized(page, 'ongoing-title');
      await expectPseudoLocalized(page, 'events-view-all-link');
      await expectPseudoLocalized(page, 'events-pause-button');
    });

    await test.step('Verify utilization card is pseudolocalized', async () => {
      const utilizationCard = page.getByTestId('utilization-card');
      await expect(utilizationCard).toBeVisible();

      const title = utilizationCard.getByTestId('utilization-card__title');
      await expect(title).toHaveText(PSEUDO_LOCALIZED_PATTERN);

      const texts = await collectNonEmptyTexts(page, 'utilization-card-item-text');
      expect(texts.length).toBeGreaterThan(0);
      for (const text of texts) {
        expect(text).toMatch(PSEUDO_LOCALIZED_PATTERN);
      }
    });
  });
});
