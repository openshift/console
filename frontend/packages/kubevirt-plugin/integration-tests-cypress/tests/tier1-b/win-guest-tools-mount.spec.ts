import { OperatingSystem } from '../../../integration-tests/tests/utils/constants/wizard';
import { testName } from '../../support';
import { K8S_KIND } from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { resourceTitle, row } from '../../views/selector';
import * as wizardView from '../../views/selector-wizard';
import { tab } from '../../views/tab';

const WIN_GT = 'windows-guest-tools';
const templateName = `tmpl-${testName}`;
const vmName = `vm-${testName}`;

const verifyWinGuestTools = () => {
  cy.get(wizardView.wizardNavLink)
    .contains('Storage')
    .should('not.be.disabled')
    .click();
  cy.get(row)
    .contains(WIN_GT)
    .should('exist');
  cy.get(wizardView.wizardNavLink)
    .contains('General')
    .click();
  cy.get(wizardView.mountGuestTool).uncheck();
  cy.get(wizardView.wizardNavLink)
    .contains('Storage')
    .click();
  cy.get(row)
    .contains(WIN_GT)
    .should('not.exist');
  cy.get('#create-vm-wizard-reviewandcreate-btn').click();
  cy.get('.kubevirt-create-vm-modal__review-tab__footer').then(($ftr) => {
    if ($ftr.find(wizardView.startOnCreation).length > 0) {
      cy.get(wizardView.startOnCreation).uncheck();
    }
  });
  cy.get('#create-vm-wizard-submit-btn').click();
  cy.byLegacyTestID('kubevirt-wizard-success-result').should('be.visible');
  cy.get('button.pf-m-primary').click();
  cy.get(resourceTitle)
    .contains(testName)
    .should('exist');
  tab.navigateToDisk();
  cy.get(row)
    .contains(WIN_GT)
    .should('not.exist');
};

describe('Windows guest tool mount', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, vmName, testName);
    cy.deleteResource(K8S_KIND.Template, templateName, testName);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-7491) Test Windows guest tool mount control for template creation', () => {
    cy.visitVMTemplatesList();
    cy.get('#item-create').click();
    cy.get('#wizard-link').click();
    cy.get(wizardView.vmName)
      .clear()
      .type(templateName);
    cy.get(wizardView.templateProvider)
      .clear()
      .type(`CNV-QE`);
    cy.get(wizardView.osDropdown).click();
    cy.get('button')
      .contains(OperatingSystem.WINDOWS_10)
      .click({ force: true });
    cy.get(wizardView.imageSourceDropdown).click();
    cy.get(wizardView.selectMenu)
      .contains(ProvisionSource.REGISTRY.getDescription())
      .click();
    cy.get(wizardView.sourceRegistry)
      .clear()
      .type(ProvisionSource.REGISTRY.getSource());
    verifyWinGuestTools();
  });

  it('ID(CNV-7506) Test Windows guest tool mount control for VM creation', () => {
    cy.visitVMsList();
    cy.byLegacyTestID('item-create').click();
    cy.byLegacyTestID('vm-wizard').click();
    cy.get(wizardView.templateTitle)
      .contains(OperatingSystem.WINDOWS_10)
      .click({ force: true });
    cy.get(wizardView.next).click();
    cy.get(wizardView.imageSourceDropdown).click();
    cy.get(wizardView.selectMenu)
      .contains(ProvisionSource.REGISTRY.getDescription())
      .click();
    cy.get(wizardView.sourceRegistry)
      .clear()
      .type(ProvisionSource.REGISTRY.getSource());
    cy.get(wizardView.next).click();
    cy.get(wizardView.vmName)
      .clear()
      .type(vmName);
    cy.get(wizardView.customizeBtn).click();
    verifyWinGuestTools();
  });
});
