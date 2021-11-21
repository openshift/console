import { testName } from '../../support';
// const testName = 'manual-four-ten';
import { TEMPLATE } from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { actionButtons } from '../../views/selector';
import * as wizardView from '../../views/selector-wizard';

describe('Custom template VM with cloudinit disk', () => {
  before(() => {
    cy.Login();
    // cy.createProject(testName);
    cy.visit('/k8s/ns/manual-four-ten/virtualization/templates');
  });

  after(() => {
    // cy.deleteTestProject(testName);
  });

  it('ID(CNV-) Custom template VM creation', () => {
    cy.visitVMTemplatesList();
    cy.byLegacyTestID(TEMPLATE.RHEL8.metadataName).click();
    cy.byLegacyTestID(actionButtons.actionDropdownButton).click();
    cy.byTestActionID('Create new Template').click();
    cy.get(wizardView.vmName)
      .clear()
      .type(TEMPLATE.DEFAULT.metadataName);
    cy.byLegacyTestID(wizardView.templateProvider)
      .clear()
      .type('CNV QE');
    cy.get(wizardView.imageSourceDropdown).click();
    cy.get(wizardView.selectMenu)
      .contains(ProvisionSource.REGISTRY.getDescription())
      .click({ force: true });
    cy.get(wizardView.sourceRegistry)
      .clear()
      .type(ProvisionSource.REGISTRY.getSource());
    cy.get('#create-vm-wizard-reviewandcreate-btn').click();
    cy.get('#create-vm-wizard-submit-btn').click();
    cy.get('[data-test="success-list"]')
      .should('exist')
      .click();
    cy.get('data-test-id="vm-template-example"').should('exist');
  });
});
