import { detailsPage } from './details-page';
import { listPage } from './list-page';
import { modal } from './modal';

export const secrets = {
  clickCreateKeyValSecretDropdownButton: () => {
    cy.byTestID('item-create')
      .click()
      .get('body')
      .then(($body) => {
        if ($body.find(`[data-test-dropdown-menu="generic"]`).length) {
          cy.get(`[data-test-dropdown-menu="generic"]`).click();
        }
      });
  },
  deleteSecret: () => {
    detailsPage.clickPageActionFromDropdown('Delete Secret');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    listPage.titleShouldHaveText('Secrets');
  },
};
