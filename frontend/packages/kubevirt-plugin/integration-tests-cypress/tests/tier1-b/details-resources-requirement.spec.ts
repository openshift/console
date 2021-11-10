import { testName } from '../../support';
import { K8S_KIND, VM_STATUS, YAML_VM_NAME } from '../../utils/const/index';
import {
  defaultFlavorString,
  dedicatedResourcesString,
  LiveMigrate,
} from '../../utils/const/string';
import {
  detailsTab,
  modalConfirm,
  modalTitle,
  pendingChangeAlert,
  saveAndRestart,
} from '../../views/selector';
import {
  flavor,
  flavorSelect,
  customCPU,
  customMem,
  dedicatedResources,
  dedicatedResourcesCheckbox,
  evictionStrategy,
  liveMigrateCheckbox,
} from '../../views/selector-tabs';
import { tab } from '../../views/tab';
import { waitForStatus, vm } from '../../views/vm';

const flavorCustomString = 'Custom: 2 CPU | 3 GiB Memory';
const getDedicatedCPU = `oc get vm -n ${testName} ${YAML_VM_NAME} --template {{.spec.template.spec.domain.cpu.dedicatedCpuPlacement}}`;
const getEvictionStrategy = `oc get vm -n ${testName} ${YAML_VM_NAME} --template {{.spec.template.spec.evictionStrategy}}`;

describe('Test VM dedicated resources', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
    cy.visitVMsList();
    cy.createDefaultVM();
    tab.navigateToDetails();
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, YAML_VM_NAME, testName);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-3731) Enable dedicated resources guaranteed policy', () => {
    cy.get(dedicatedResources)
      .find(detailsTab.vmEditWithPencil)
      .click();
    cy.get(dedicatedResourcesCheckbox).check();
    cy.get(modalConfirm).click();
    cy.get(modalTitle).should('not.exist');
    cy.get(dedicatedResources).should('contain', dedicatedResourcesString);
    cy.exec(getDedicatedCPU)
      .its('stdout')
      .should('equal', 'true');
    // uncheck it again;
    cy.get(dedicatedResources)
      .find(detailsTab.vmEditWithPencil)
      .click();
    cy.get(dedicatedResourcesCheckbox).uncheck();
    cy.get(modalConfirm).click();
    cy.get(modalTitle).should('not.exist');
  });

  it('ID(CNV-7245) Enable/disable VM eviction strategy', () => {
    if (Cypress.env('DOWNSTREAM')) {
      cy.get(evictionStrategy).should('contain', LiveMigrate);
      cy.exec(getEvictionStrategy).then((output) => {
        expect(output.stdout).toEqual(LiveMigrate);
      });
      cy.get(evictionStrategy)
        .find(detailsTab.vmEditWithPencil)
        .click();
      cy.get(liveMigrateCheckbox).click();
      cy.get(modalConfirm).click();
      cy.get(modalTitle).should('not.exist');
      cy.get(evictionStrategy).should('contain', 'No Eviction Strategy');
      cy.exec(getEvictionStrategy).then((output) => {
        expect(output.stdout).not.toEqual(LiveMigrate);
      });
    }
  });

  it('ID(CNV-3076) Change VM flavor', () => {
    vm.start();
    cy.get(flavor).should('contain', defaultFlavorString);
    cy.get(flavor)
      .find(detailsTab.vmEditWithPencil)
      .click();
    cy.get(flavorSelect).select('Custom');
    cy.get(customCPU).type('2');
    cy.get(customMem).type('3');
    cy.get(modalConfirm).click();
    cy.get(modalTitle).should('not.exist');
    cy.get(flavor).should('contain', flavorCustomString);
    cy.get(pendingChangeAlert).should('contain', 'Flavor');
    cy.get(flavor)
      .find(detailsTab.vmEditWithPencil)
      .click();
    cy.get(saveAndRestart).click();
    cy.get(modalConfirm).click();
    waitForStatus(VM_STATUS.Starting);
    waitForStatus(VM_STATUS.Running);
    cy.get(pendingChangeAlert).should('not.exist');
  });
});
