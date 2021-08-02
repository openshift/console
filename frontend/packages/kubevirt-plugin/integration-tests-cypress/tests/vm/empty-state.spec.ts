import { testName } from '../../support';
import { virtualization } from '../../view/virtualization';

describe('ID(CNV-5654) test vm empty state', () => {
  before(() => {
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  beforeEach(() => {
    virtualization.vms.visit();
  });

  // CI does not have quickstarts
  xit('Empty state has link to quick starts', () => {
    virtualization.vms.emptyState.clickQuickStarts();
    cy.get('.pf-c-search-input__text-input').should('have.value', 'virtual machine');
  });

  it('Empty state has action to create VM', () => {
    virtualization.vms.emptyState.clickCreate();
    cy.url().should('include', `~new-from-template?namespace=${testName}`);
  });

  it('Empty state has link to templates tab', () => {
    virtualization.vms.emptyState.clickTemplatesTab();
    cy.url().should('include', '/virtualization/templates');
    cy.byLegacyTestID('horizontal-link-Templates')
      .parent()
      .should('have.class', 'co-m-horizontal-nav-item--active');
  });
});
