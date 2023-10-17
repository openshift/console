import { Base64 } from 'js-base64';
import { detailsPage } from './details-page';
import { listPage } from './list-page';
import { modal } from './modal';

export const secrets = {
  addSecretToWorkload: (resourceName: string) => {
    cy.byTestID('Add Secret to workload').click();
    modal.shouldBeOpened();
    modal.modalTitleShouldContain('Add secret to workload');
    cy.get('#co-add-secret-to-workload__workload').click();
    cy.byLegacyTestID('dropdown-text-filter').type(resourceName);
    cy.byTestID('dropdown-menu-item-link').click();
  },
  checkSecret: (keyValuesToCheck: object, jsonOutput: boolean = false) => {
    secrets.clickRevealValues();
    const renderedKeyValues = {};
    cy.byTestID('secret-data')
      .find('[data-test="secret-data-term"]')
      .each(($el, index) => {
        const key = $el.text();
        cy.get('[data-test="copy-to-clipboard"]')
          .eq(index)
          .invoke('text')
          .then(($text) => {
            renderedKeyValues[key] = jsonOutput ? JSON.parse($text) : $text;
          });
      })
      .then(() => {
        expect(renderedKeyValues).toEqual(keyValuesToCheck);
      });
  },
  clickAddCredentialsButton: () => cy.byTestID('add-credentials-button').click(),
  clickRemoveEntryButton: () => cy.byTestID('remove-entry-button').first().click(),
  clickRevealValues: () => {
    cy.byTestID('reveal-values').click();
  },
  clickCreateSecretDropdownButton: (secretType: string) => {
    cy.byTestID('item-create')
      .click()
      .get('body')
      .then(($body) => {
        if ($body.find(`[data-test-dropdown-menu=${secretType}]`).length) {
          cy.get(`[data-test-dropdown-menu=${secretType}]`).click();
        }
      });
  },
  deleteSecret: (secretName: string) => {
    detailsPage.clickPageActionFromDropdown('Delete Secret');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    listPage.rows.shouldNotExist(secretName);
  },
  detailsPageIsLoaded: (secretName: string) => {
    cy.byTestID('loading-indicator').should('not.exist');
    detailsPage.isLoaded();
    detailsPage.titleShouldContain(secretName);
  },
  encode: (username, password) => Base64.encode(`${username}:${password}`),
  enterSecretName: (secretName: string) => cy.byTestID('secret-name').type(secretName),
  getResourceJSON: (name: string, namespace: string, kind: string) => {
    return cy.exec(`kubectl get -o json -n ${namespace} ${kind} ${name}`);
  },
  save: () => cy.byTestID('save-changes').click(),
};
