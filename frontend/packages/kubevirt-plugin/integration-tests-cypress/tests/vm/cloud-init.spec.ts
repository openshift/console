import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import * as wizardView from '../../view/selector-wizard';
import { virtualization } from '../../view/virtualization';
import { wizard } from '../../view/wizard';

const yamlUserName = 'cloud-user';
const yamlPassword = 'atomic';
const yamlHostName = `vm-${testName}`;
const cloudInitScript = `#cloud-config\nuser: ${yamlUserName}\npassword: ${yamlPassword}\nchpasswd: {expire: False}\nhostname: ${yamlHostName}`;

const vmData: VirtualMachineData = {
  name: `cloud-init-${testName}`,
  description: 'VM creation wizard Cloud init',
  namespace: testName,
  template: 'Red Hat Enterprise Linux 6.0+ VM',
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
  cloudInit: {
    customScript: cloudInitScript,
  },
};

describe('VM creation wizard Cloud init editor fields', () => {
  before(() => {
    cy.createProject(testName);
    virtualization.vms.visit();
    wizard.vm.open();
    wizard.vm.selectTemplate(vmData);
    cy.byLegacyTestID('wizard-customize').click();
    wizard.vm.fillGeneralForm(vmData);
    wizard.vm.fillNetworkForm(vmData);
    wizard.vm.fillStorageForm(vmData);
    cy.get(wizardView.cloudInit).click();
    cy.get('#cloud').click();
    cy.contains('Configure via:').should('be.visible');
  });

  after(() => {
    cy.get(wizardView.cancelBtn);
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  xit('ID(CNV-6879): Cloud init editor should have user and password fields in the form.', () => {
    cy.get(wizardView.username)
      .should('exist')
      .should('not.be.empty');
    cy.get(wizardView.password)
      .should('exist')
      .should('not.be.empty');
    cy.get(wizardView.hostname).should('exist');
  });

  it('ID(CNV-6878): Cloud init editor should preserve state when moving from yaml to form.', () => {
    cy.get('#CloudInitAdvancedTabWithEditor-yaml-checkbox').click();
    cy.get(wizardView.yamlEditor).within(() => {
      cy.get('textarea')
        .clear()
        .type(cloudInitScript);
    });

    cy.get(wizardView.formView).click();
    cy.get(wizardView.username)
      .should('exist')
      .should('have.value', yamlUserName);
    cy.get(wizardView.password)
      .should('exist')
      .should('have.value', yamlPassword);
    cy.get(wizardView.hostname)
      .should('exist')
      .should('have.value', yamlHostName);
  });
});
