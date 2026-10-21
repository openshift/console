import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';

describe('Node terminal', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.initAdmin();
  });

  afterEach(() => {
    checkErrors();
  });

  it('Opens a debug terminal', () => {
    cy.visit(`/k8s/cluster/nodes`);
    listPage.titleShouldHaveText('Nodes');
    listPage.dvRows.shouldBeLoaded();
    listPage.dvRows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    detailsPage.selectTab('Terminal');
    cy.byTestID('node-terminal-error').should('not.exist');
    cy.get('[class="xterm-viewport"]').should('exist');
    // navigate back to Overview tab so the temporary namespace is deleted
    cy.get('a[data-test-id="horizontal-link-Overview"]').should('exist').click();
  });
});
