import { testName } from '../../support';
import { TEMPLATE } from '../../utils/const/index';
import { virtualization } from '../../views/virtualization';

const rhel9 = TEMPLATE.RHEL9;
const testDescribe = Cypress.env('DOWNSTREAM') ? describe : xdescribe;

testDescribe('Test RHEL9 template', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.visitVMTemplatesList();
    cy.contains(rhel9.name).should('be.visible');
  });

  after(() => {
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-7185) Verify RHEL9 template is not starred', () => {
    virtualization.templates.testStarIcon(rhel9.name, true);
  });

  it('ID(CNV-7186) Verify RHEL9 template support level', () => {
    virtualization.templates.testSupport(rhel9.name, rhel9.supportLevel);
  });
});
