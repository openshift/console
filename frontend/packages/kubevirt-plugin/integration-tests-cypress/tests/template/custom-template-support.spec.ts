import { testName } from '@console/cypress-integration-tests/support';
import {
  ADD_SOURCE,
  IMPORTING,
  K8S_KIND,
  OS_IMAGES_NS,
  TEMPLATE,
  TEST_PROVIDER,
  VM_ACTION_TIMEOUT,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { addSource } from '../../views/add-source';
import * as templateSupportModal from '../../views/template-support-modal';
import { virtualization } from '../../views/virtualization';

const template = TEMPLATE.RHEL6;
const TEMPLATE_PROVIDER = 'bar';

describe('test custom template creation support', () => {
  before(() => {
    cy.login();
    cy.visit('');
    cy.createProject(testName);
  });

  beforeEach(() => {
    cy.visitVMTemplatesList();
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-5729) create custom template from common template with no boot source', () => {
    const NEW_TEMPLATE_NAME = `foo-no-source-${testName}`;
    const VM_NAME_NO_BOOT_SOURCE = `foo-vm-no-source-${testName}`;

    virtualization.templates.testSource(template.name, ADD_SOURCE);
    virtualization.templates.clickCreateNewTemplateFrom(template.name);

    // verify template fields
    cy.get('#operating-system-dropdown').contains(template.os);
    cy.get('#flavor-dropdown').contains('Small (default): 1 CPU | 2 GiB Memory');
    cy.get('#workload-profile-dropdown').contains('Server (default)');

    // fill other fields
    cy.get('#vm-name').type(NEW_TEMPLATE_NAME);
    cy.get('#template-provider').type(TEMPLATE_PROVIDER);

    // add source
    cy.get('#image-source-type-dropdown').click();
    cy.get('.pf-c-select__menu')
      .contains(ProvisionSource.REGISTRY.getDescription())
      .click();
    cy.get('input[id="provision-source-container"]').type(ProvisionSource.REGISTRY.getSource());

    // finish creation of the new template
    cy.get('#create-vm-wizard-reviewandcreate-btn').click();
    cy.get('#create-vm-wizard-submit-btn').click();
    cy.byTestID('success-list').click();

    // verify source is available
    virtualization.templates.testSource(NEW_TEMPLATE_NAME, 'bar');

    // create VM from the template
    virtualization.templates.clickCreate(NEW_TEMPLATE_NAME);

    templateSupportModal.closeTemplateSupportModal();

    cy.get('#project-dropdown').click();
    cy.get(`#${testName}-Project-link`).click();
    cy.get('#vm-name').clear();
    cy.get('#vm-name').type(VM_NAME_NO_BOOT_SOURCE);
    cy.byLegacyTestID('wizard-next').click();
    cy.byTestID('success-list').click();

    // verify VM started
    virtualization.vms.testStatus(
      VM_NAME_NO_BOOT_SOURCE,
      'Running',
      VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
    );
  });

  it('ID(CNV-5729) create custom template from common template with a boot source', () => {
    const NEW_TEMPLATE_NAME = `foo-with-source-${testName}`;
    const VM_NAME_WITH_BOOT_SOURCE = `foo-vm-with-source-${testName}`;

    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);

    virtualization.templates.clickCreateNewTemplateFrom(template.name);

    // verify template fields
    cy.get('#operating-system-dropdown').contains(template.os);
    cy.get('#flavor-dropdown').contains('Small (default): 1 CPU | 2 GiB Memory');
    cy.get('#workload-profile-dropdown').contains('Server (default)');

    // make sure source field isn't displayed
    cy.get('#image-source-type-dropdown').should('not.exist');

    // fill other fields
    cy.get('#vm-name').type(NEW_TEMPLATE_NAME);
    cy.get('#template-provider').type(TEMPLATE_PROVIDER);

    // finish creation of the new template
    cy.get('#create-vm-wizard-reviewandcreate-btn').click();
    cy.get('#create-vm-wizard-submit-btn').click();
    cy.byTestID('success-list').click();

    // verify source is available
    virtualization.templates.testSource(NEW_TEMPLATE_NAME, 'bar');

    // create VM from the template
    virtualization.templates.clickCreate(NEW_TEMPLATE_NAME);
    templateSupportModal.closeTemplateSupportModal();
    cy.get('#project-dropdown').click();
    cy.get(`#${testName}-Project-link`).click();
    cy.get('#vm-name').clear();
    cy.get('#vm-name').type(VM_NAME_WITH_BOOT_SOURCE);
    cy.byLegacyTestID('wizard-next').click();
    cy.byTestID('success-list').click();

    // verify VM started
    virtualization.vms.testStatus(
      VM_NAME_WITH_BOOT_SOURCE,
      'Starting',
      VM_ACTION_TIMEOUT.VM_BOOTUP,
    );
    virtualization.vms.testStatus(VM_NAME_WITH_BOOT_SOURCE, 'Running', VM_ACTION_TIMEOUT.VM_BOOTUP);
  });
});
