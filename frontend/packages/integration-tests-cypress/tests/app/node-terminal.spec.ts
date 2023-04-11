import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';

describe('Node terminal', () => {
  before(() => {
    cy.login();
    cy.visit('/');
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('Opens a debug terminal', () => {
    cy.visit(`/k8s/cluster/nodes`);
    listPage.titleShouldHaveText('Nodes');
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    detailsPage.selectTab('Terminal');
    cy.byTestID('node-terminal-error').should('not.exist');
    cy.get('[class="xterm-viewport"]').should('exist');
    // navigate back to Overview tab so the temporary namespace is deleted
    cy.get('a[data-test-id="horizontal-link-Overview"]')
      .should('exist')
      .click();
  });
});
