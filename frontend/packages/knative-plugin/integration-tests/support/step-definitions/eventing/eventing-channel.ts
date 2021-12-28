import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  addOptions,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants';
import { addPage } from '@console/dev-console/integration-tests/support/pages';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages/app';

When('user navigates to Add page}', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user clicks on the Channel card', () => {
  addPage.selectCardFromOptions(addOptions.Channel);
});

Then('user clicks on YAML view', () => {
  cy.get('[id="form-radiobutton-editorType-yaml-field"]')
    .should('be.visible')
    .click();
});

Then('user can see reate button enabled', () => {
  modal.submitShouldBeEnabled();
});
