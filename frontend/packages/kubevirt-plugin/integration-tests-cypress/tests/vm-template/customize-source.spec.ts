import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { addSource } from '../../view/add-source';
import { customizeSource, PROVIDER } from '../../view/customize-source';
import { virtualization } from '../../view/virtualization';

const TEMPLATE = Cypress.env('TEMPLATE_NAME');

describe('test vm template source image', () => {
  before(() => {
    cy.login();
    cy.visit('');
    cy.createProject(testName);
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: {
        name: Cypress.env('TEMPLATE_BASE_IMAGE'),
        namespace: Cypress.env('OS_IMAGES_NS'),
      },
    });
    cy.cdiCloner(testName);
  });

  after(() => {
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: {
        name: Cypress.env('TEMPLATE_BASE_IMAGE'),
        namespace: Cypress.env('OS_IMAGES_NS'),
      },
    });
  });

  it('customize common template source', () => {
    const vmtName = 'tmp-customized';
    virtualization.templates.visit();
    virtualization.templates.addSource(TEMPLATE);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(TEMPLATE, 'Importing');
    virtualization.templates.testSource(TEMPLATE, 'Available');

    virtualization.templates.customizeSource(TEMPLATE);
    customizeSource.fillForm({ vmtName });

    virtualization.templates.visit();
    virtualization.templates.testSource(vmtName, 'Preparing for customization');
    virtualization.templates.testSource(vmtName, 'Ready for customization');
    virtualization.templates.launchConsole(vmtName);
    customizeSource.finishCustomization();
    virtualization.templates.filter(vmtName);
    virtualization.templates.testSource(vmtName, PROVIDER);
  });

  it('customize user template source', () => {
    const vmtName = 'tmp-user-customized';
    cy.createUserTemplate(testName);
    virtualization.templates.visit();

    virtualization.templates.customizeSource(TEMPLATE);
    customizeSource.fillForm({ vmtName });

    virtualization.templates.visit();
    virtualization.templates.testSource(vmtName, 'Preparing for customization');
    virtualization.templates.testSource(vmtName, 'Ready for customization');
    virtualization.templates.launchConsole(vmtName);
    customizeSource.finishCustomization();
    virtualization.templates.filter(vmtName);
    virtualization.templates.testSource(vmtName, PROVIDER);
  });
});
