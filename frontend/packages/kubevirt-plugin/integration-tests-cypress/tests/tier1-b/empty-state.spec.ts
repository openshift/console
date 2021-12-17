import { testName } from '../../support';
import { virtualization } from '../../views/virtualization';

describe('ID(CNV-5654) test vm empty state', () => {
  before(() => {
    cy.Login();
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
    cy.url().should('include', `~new/wizard?namespace=${testName}`);
  });

  it('Empty state has action to create Template and right url', () => {
    virtualization.templates.visit();
    cy.url().should('include', '/virtualmachinetemplates');
  });
});
