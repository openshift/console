import { testName } from '../../support';
import { K8S_KIND, YAML_VM_NAME } from '../../utils/const/index';
import {
  noSelector,
  oneMatchNode,
  zeroTolerationRules,
  zeroAffinityRule,
} from '../../utils/const/string';
import { alertTitle, detailsTab, modalConfirm, modalCancel } from '../../views/selector';
import {
  affinityRules,
  affinityRuleValueInput,
  nodeSelector,
  tolerations,
  addBtn,
  keyInput,
  valueInput,
  deleteBtn,
  editBtnIcon,
} from '../../views/selector-tabs';
import { tab } from '../../views/tab';
import { vm } from '../../views/vm';

const key1 = 'key1';
const value1 = 'value1';
const getFirstNode = `kubectl get node -l kubevirt.io/schedulable=true | awk 'NR==2{print $1}'`;

function labelNode(node: string, key: string, value: string) {
  cy.exec(`kubectl label --overwrite=true node ${node} ${key}=${value}`);
}

function unlabelNode(node: string, key: string) {
  cy.exec(`kubectl label --overwrite=true node ${node} ${key}-`);
}

function taintNode(node: string, key: string, value: string) {
  cy.exec(`kubectl taint --overwrite=true nodes ${node} ${key}=${value}:NoSchedule`);
}

function untaintNode(node: string, key: string) {
  cy.exec(`kubectl taint nodes ${node} ${key}:NoSchedule- || true`);
}

function addLabel(type: string, key: string, value: string) {
  cy.get(addBtn).click();
  cy.get(keyInput(type)).type(key);
  cy.get(valueInput(type)).type(value);
  cy.get(alertTitle).should('contain', oneMatchNode);
  cy.get(modalConfirm).click();
  cy.get(modalCancel).should('not.exist');
}

function removeLabel(type: string) {
  cy.get(deleteBtn(type)).click();
  cy.get(modalConfirm).click();
  cy.get(modalCancel).should('not.exist');
}

describe('Test VM scheduling policy', () => {
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
    cy.exec(getFirstNode).then((output) => {
      const node = output.stdout;
      unlabelNode(node, key1);
      untaintNode(node, key1);
    });
  });

  it('ID(CNV-4489) VM is scheduled on labeled node', () => {
    cy.exec(getFirstNode).then((output) => {
      const node = output.stdout;
      labelNode(node, key1, value1);
      cy.get(nodeSelector)
        .find(detailsTab.vmEditWithPencil)
        .click();
      addLabel('label', key1, value1);
      cy.get(nodeSelector).should('contain', `${key1}=${value1}`);
      vm.start();
      cy.byLegacyTestID(node).should('exist');
      unlabelNode(node, key1);
    });
    vm.stop();
    cy.get(nodeSelector)
      .find(editBtnIcon)
      .should('exist');
    cy.get(nodeSelector)
      .find(editBtnIcon)
      .click();
    removeLabel('label');
    cy.get(nodeSelector).should('contain', noSelector);
  });

  it('ID(CNV-4491) VM can be scheduled to tainted node with matching tolerations', () => {
    // make it downstream only as tainted node may cause flakes, which is hard to debug in upstream
    if (Cypress.env('DOWNSTREAM')) {
      cy.exec(getFirstNode).then((output) => {
        const node = output.stdout;
        taintNode(node, key1, value1);
        cy.get(tolerations)
          .find(detailsTab.vmEditWithPencil)
          .click();
        addLabel('toleration', key1, value1);
        cy.get(tolerations).should('contain', '1 Toleration rule');
        vm.start();
        cy.byLegacyTestID(node).should('exist');
        untaintNode(node, key1);
      });
      vm.stop();
      cy.get(tolerations)
        .find(editBtnIcon)
        .should('exist');
      cy.get(tolerations)
        .find(editBtnIcon)
        .click();
      removeLabel('toleration');
      cy.get(tolerations).should('contain', zeroTolerationRules);
    }
  });

  it('ID(CNV-4159) VM can be scheduled to node with affinity rules', () => {
    cy.exec(getFirstNode).then((output) => {
      const node = output.stdout;
      labelNode(node, key1, value1);
      cy.get(affinityRules)
        .find(detailsTab.vmEditWithPencil)
        .click();
      cy.byButtonText('Add Affinity rule').click();
      cy.get(keyInput('affinity-expression')).type(key1);
      cy.get(affinityRuleValueInput).click();
      cy.get(affinityRuleValueInput).type(value1);
      cy.contains('.pf-c-select__menu-item', 'Create').click();
      cy.get(modalConfirm).click();
      cy.get(alertTitle).should('contain', oneMatchNode);
      cy.get(modalConfirm).click();
      cy.get(modalCancel).should('not.exist');
      cy.get(affinityRules).should('contain', '1 Affinity rule');
      vm.start();
      cy.byLegacyTestID(node).should('exist');
      unlabelNode(node, key1);
    });
    vm.stop();
    cy.get(affinityRules)
      .find(editBtnIcon)
      .should('exist');
    cy.get(affinityRules)
      .find(editBtnIcon)
      .click();
    cy.byLegacyTestID('kebab-button').click();
    cy.byTestActionID('Delete').click();
    cy.get(modalConfirm).click();
    cy.get(modalCancel).should('not.exist');
    cy.get(affinityRules).should('contain', zeroAffinityRule);
  });
});
