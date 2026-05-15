import { test, expect } from '../../fixtures';
import { DetailsPage } from '../../pages/details-page';
import { ModalPage } from '../../pages/modal-page';

test.describe('Edit default catalog sources', { tag: ['@admin'] }, () => {
  test('disables and re-enables default catalog sources from OperatorHub details page', async ({
    page,
  }) => {
    const detailsPage = new DetailsPage(page);
    const modalPage = new ModalPage(page);
    const defaultSourceToBeToggled = 'redhat-operators';

    await test.step('Navigate to OperatorHub configuration page', async () => {
      await page.goto('/settings/cluster');
      await page.locator('[data-test-id="horizontal-link-Configuration"]').click();
      await page.locator('[data-test-id="OperatorHub"]').click();
      await detailsPage.sectionHeaderShouldExist('OperatorHub details');
    });

    await test.step('Disable the default source via modal', async () => {
      await page.getByTestId('Default sources-details-item__edit-button').click();
      await modalPage.modalTitleShouldContain('Edit default sources');
      await page.getByTestId(`${defaultSourceToBeToggled}__checkbox`).click();
      await modalPage.submit();
      await expect(page.getByTestId(`status_${defaultSourceToBeToggled}`)).toHaveText('Disabled');
    });

    await test.step('Re-enable the default source via modal', async () => {
      await page.getByTestId('Default sources-details-item__edit-button').click();
      await modalPage.modalTitleShouldContain('Edit default sources');
      await page.getByTestId(`${defaultSourceToBeToggled}__checkbox`).click();
      await modalPage.submit();
      await expect(page.getByTestId(`status_${defaultSourceToBeToggled}`)).toHaveText('Enabled');
    });
  });
});
