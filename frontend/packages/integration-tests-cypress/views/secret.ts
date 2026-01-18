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
    cy.byTestID('console-select-search-input').type(resourceName);
    cy.byTestID('console-select-item').click();
  },
  addKeyValue: (key: string, value: string) => {
    cy.byTestID('add-credentials-button').click();
    cy.byTestID('secret-key').last().clear().type(key);
    cy.byLegacyTestID('file-input-textarea').last().clear().type(value);
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
  checkKeyValueExist: (key: string, value: string) => {
    // Just for one new added key/value
    secrets.clickRevealValues();
    cy.byTestID('secret-data-term').first().should('have.text', key);
    cy.get('code').first().should('have.text', value);
  },
  clickAddCredentialsButton: () => cy.byTestID('add-credentials-button').click(),
  clickRemoveEntryButton: () => cy.byTestID('remove-entry-button').first().click(),
  clickRevealValues: () => {
    // Wait for page to fully stabilize
    cy.byTestID('loading-indicator', { timeout: 5000 }).should('not.exist');
    // Click reveal-values button with force to handle re-renders
    cy.byTestID('reveal-values', { timeout: 30000 }).should('be.visible').click({ force: true });
    // Wait for data to be revealed
    cy.byTestID('secret-data', { timeout: 10000 }).should('be.visible');
  },
  clickCreateSecretDropdownButton: (secretType: string) => {
    cy.byTestID('item-create')
      .click({ force: true })
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
    // Wait for loading to complete
    cy.byTestID('loading-indicator', { timeout: 5000 }).should('not.exist');
    detailsPage.isLoaded();
    detailsPage.titleShouldContain(secretName);
    // Wait for either secret-data (has data) or empty-box (no data) to be visible
    cy.get('[data-test="secret-data"], .pf-v6-c-empty-state', { timeout: 30000 })
      .should('exist')
      .and('be.visible');
  },
  encode: (username, password) => Base64.encode(`${username}:${password}`),
  enterSecretName: (secretName: string) => cy.byTestID('secret-name').type(secretName),
  getResourceJSON: (name: string, namespace: string, kind: string) => {
    return cy.exec(`oc get -o json -n ${namespace} ${kind} ${name}`);
  },
  save: () => {
    cy.byTestID('save-changes', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    // Wait for navigation away from create/edit page
    cy.byTestID('save-changes').should('not.exist');
  },
};
