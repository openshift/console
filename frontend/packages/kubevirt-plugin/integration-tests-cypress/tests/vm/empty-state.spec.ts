import { testName } from '../../support';
import { virtualization } from '../../views/virtualization';

describe('ID(CNV-5654) test vm empty state', () => {
  before(() => {
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteTestProject(testName);
  });

  beforeEach(() => {
    cy.visitVMsList();
  });

  it('Empty state has link to quick starts', () => {
    // CI does not have quickstarts
    if (Cypress.env('DOWNSTREAM')) {
      virtualization.vms.emptyState.clickQuickStarts();
      // TODO: uncomment it once https://issues.redhat.com/browse/CNV-14013 is fixed.
      // cy.get('.pf-c-search-input__text-input').should('have.value', 'virtual machine');
    }
  });

  it('Empty state has action to create VM', () => {
    virtualization.vms.emptyState.clickCreate();
    cy.url().should('include', `~new-from-template?namespace=${testName}`);
  });

  it('Empty state has link to templates tab', () => {
    virtualization.vms.emptyState.clickTemplatesTab();
    cy.url().should('include', '/virtualization/templates');
    cy.byTestID('horizontal-link-Templates')
      .parent()
      .should('have.class', 'co-m-horizontal-nav-item--active');
  });
});
