import { testName } from '../../support';
import { TEMPLATE } from '../../utils/const/index';
import { unStarIcon, supportLevel, supportLevelTag } from '../../views/selector';

const template = TEMPLATE.RHEL9;

describe('Test RHEL9 template', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.visitVMTemplatesList();
    cy.filterByName(template.dvName);
  });

  after(() => {
    cy.deleteTestProject(testName);
  });

  // TODO: RHEL9 should be starred after it's official released.
  it('ID(CNV-7185) Verify RHEL9 template is not starred', () => {
    // mark it downstream only as upstream has no rhel9 template yet
    if (Cypress.env('DOWNSTREAM')) {
      cy.byLegacyTestID(template.metadataName).should('be.visible');
      cy.get(unStarIcon).should('be.visible');
    }
  });

  // TODO: RHEL9 support level on list page should be Limited once bz1998162 is fixed.
  it('ID(CNV-7186) Verify RHEL9 template support level', () => {
    if (Cypress.env('DOWNSTREAM')) {
      cy.get(supportLevelTag).should('contain', 'Community');
      cy.byLegacyTestID(template.metadataName).click();
      cy.get(supportLevel).should('contain', template.supportLevel);
    }
  });
});
