import { testName } from '../../support';
import {
  IMPORTING,
  OS_IMAGES_NS,
  PREPARING_FOR_CUSTOMIZATION,
  READY_FOR_CUSTOMIZATION,
  TEMPLATE,
  TEST_PROVIDER,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { addSource } from '../../views/add-source';
import { customizeSource, PROVIDER } from '../../views/customize-source';
import { virtualization } from '../../views/virtualization';

const template = TEMPLATE.RHEL6;

describe('test vm template source image', () => {
  before(() => {
    cy.Login();
    cy.visit('');
    cy.createProject(testName);
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: {
        name: template.dvName,
        namespace: OS_IMAGES_NS,
      },
    });
    cy.cdiCloner(testName, OS_IMAGES_NS);
  });

  after(() => {
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: {
        name: template.dvName,
        namespace: OS_IMAGES_NS,
      },
    });
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  it('customize common template source', () => {
    const vmtName = 'tmp-customized';
    virtualization.templates.visit();
    virtualization.templates.addSource(template.name);
    addSource.addBootSource(ProvisionSource.REGISTRY);
    virtualization.templates.testSource(template.name, IMPORTING);
    virtualization.templates.testSource(template.name, TEST_PROVIDER);

    virtualization.templates.customizeSource(template.metadataName);
    customizeSource.fillForm({ vmtName });

    virtualization.templates.visit();
    virtualization.templates.testSource(vmtName, PREPARING_FOR_CUSTOMIZATION);
    virtualization.templates.testSource(vmtName, READY_FOR_CUSTOMIZATION);
    virtualization.templates.launchConsole(vmtName);
    customizeSource.finishCustomization();
    virtualization.templates.filter(vmtName);
    virtualization.templates.testSource(vmtName, PROVIDER);
  });

  it('customize user template source', () => {
    const vmtName = 'tmp-user-customized';
    cy.createUserTemplate(testName);
    virtualization.templates.visit();

    virtualization.templates.customizeSource(template.metadataName);
    customizeSource.fillForm({ vmtName });

    virtualization.templates.visit();
    virtualization.templates.testSource(vmtName, PREPARING_FOR_CUSTOMIZATION);
    virtualization.templates.testSource(vmtName, READY_FOR_CUSTOMIZATION);
    virtualization.templates.launchConsole(vmtName);
    customizeSource.finishCustomization();
    virtualization.templates.filter(vmtName);
    virtualization.templates.testSource(vmtName, PROVIDER);
  });
});
