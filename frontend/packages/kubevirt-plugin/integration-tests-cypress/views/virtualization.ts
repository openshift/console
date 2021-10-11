import { VirtualMachineData } from '../types/vm';
import { ADD_SOURCE, COMMUNITY, TEMPLATE_ACTION } from '../utils/const/index';
import { wizard } from './wizard';

export const getRow = (templateName: string, within: VoidFunction) =>
  cy
    .get(`[data-test-rows="resource-row"]`)
    .contains(templateName)
    .parents('tr')
    .within(within);

export const virtualization = {
  vms: {
    visit: () => cy.clickNavLink(['Workloads', 'Virtualization']),
    emptyState: {
      clickQuickStarts: () => cy.byTestID('vm-quickstart').click(),
      clickCreate: () => cy.byTestID('create-vm-empty').click(),
      clickTemplatesTab: () => cy.byTestID('vm-empty-templates').click(),
    },
    testStatus: (vmName: string, status: string, timeout: number = 60000) =>
      getRow(vmName, () => cy.byTestID('status-text', { timeout }).should('have.text', status)),
  },
  templates: {
    visit: () => {
      cy.clickNavLink(['Workloads', 'Virtualization']);
      cy.byLegacyTestID('item-create').should('exist');
      cy.byLegacyTestID('horizontal-link-Templates').click();
    },
    addSource: (templateName: string) =>
      getRow(templateName, () =>
        cy
          .byTestID('template-source')
          .find('button')
          .should('have.text', ADD_SOURCE)
          .click(),
      ),
    testProvider: (templateName: string, provider: string) =>
      getRow(templateName, () => cy.byTestID('template-provider').should('include.text', provider)),
    testSupport: (templateName: string, support?: string, parentSupport?: string) => {
      getRow(templateName, () => cy.byTestID('template-details').click());
      if (support) {
        cy.byTestID('template-support').should('exist');
        cy.byTestID('template-provider').should('include.text', support);
      } else {
        cy.byTestID('template-support').should('exist');
        cy.byTestID('template-provider').should('include.text', COMMUNITY);
      }
      if (parentSupport) {
        cy.byTestID('template-support-parent').should('exist');
        cy.byTestID('template-support-parent').should('have.text', parentSupport);
      } else {
        cy.byTestID('template-support-parent').should('not.exist');
      }
    },
    testSource: (templateName: string, sourceStatus: string, timeOut = 300000) =>
      getRow(templateName, () =>
        cy.byTestID('template-source', { timeout: timeOut }).should('contain', sourceStatus),
      ),
    deleteSource: (statusText: string) => {
      cy.contains('[data-test="status-text"]', statusText).should('be.visible');
      cy.contains('[data-test="status-text"]', statusText).click();
      cy.byTestID('delete-template-source').click();
      cy.byTestID('confirm-action').click();
    },
    customizeSource: (templateName: string) => {
      cy.get(`[data-test-template-name="${templateName}"] > button`).click();
      cy.byTestID('customize-template-source').click();
      cy.get('#confirm-action').click();
    },
    launchConsole: (templateName: string) => {
      getRow(templateName, () =>
        cy.byTestID('template-source').within(() => cy.get('button').click()),
      );
      cy.byTestID('launch-console').click();
    },
    clickCreate: (templateName: string) =>
      getRow(templateName, () => cy.byTestID('create-from-template').click()),
    filter: (templateName: string) => cy.byLegacyTestID('item-filter').type(templateName),
    clickCreateNewTemplateFrom: (templateName: string) => {
      getRow(templateName, () => cy.byLegacyTestID('kebab-button').click());
      cy.byTestActionID('Create new Template').click();
    },
    createTemplateFromWizard: (data: VirtualMachineData) => {
      wizard.template.open();
      wizard.vm.fillGeneralForm(data);
      wizard.vm.fillNetworkForm(data);
      wizard.vm.fillStorageForm(data);
      wizard.vm.fillAdvancedForm(data);
      wizard.vm.fillConfirmForm(data);
    },
    delete: (templateName: string) => {
      cy.clickNavLink(['Workloads', 'Virtualization']);
      cy.byLegacyTestID('horizontal-link-Templates').click();
      getRow(templateName, () => cy.byLegacyTestID('kebab-button').click());
      cy.contains(TEMPLATE_ACTION.Delete).click();
      cy.byTestID('confirm-action').click();
    },
  },
};
