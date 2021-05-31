import { DEPLOYMENT_REPLICAS_STATUS, MINUTE } from '../utils/consts';
import { projectNameSpace } from '../../../dev-console/integration-tests/support/pages/app';
import { modal } from '../../../integration-tests-cypress/views/modal';

export class CreateOBCHandler {
  name: string;

  namespace: string;

  storageclass: string;

  constructor(name: string, namespace: string, storageclass: string) {
    this.name = name;
    this.namespace = namespace;
    this.storageclass = storageclass;
  }

  createBucketClaim() {
    cy.clickNavLink(['Storage', 'Object Bucket Claims']);
    projectNameSpace.selectOrCreateProject(this.namespace);
    cy.clickNavLink(['Storage', 'Object Bucket Claims']);
    cy.byLegacyTestID('namespace-bar-dropdown')
      .contains('Project')
      .click();
    cy.contains(this.namespace);
    cy.byTestID('item-create').click();
    cy.byTestID('obc-name').type(this.name);
    cy.byTestID('sc-dropdown')
      .should('be.visible')
      .click();
    cy.contains('openshift-storage.noobaa.io').click();
    modal.submit();
    cy.byLegacyTestID('resource-title').contains(this.name, { timeout: MINUTE });
  }

  revealHiddenValues() {
    cy.contains('Reveal Values').click();
  }

  hideValues() {
    cy.contains('Hide Values').click();
  }

  assertNamespaceExists() {
    cy.byTestSelector('details-item-value__Namespace').contains(this.namespace);
  }

  deploymentReady(deploymentName: string) {
    cy.byLegacyTestID('horizontal-link-public~Details').click();
    cy.contains(DEPLOYMENT_REPLICAS_STATUS, { timeout: MINUTE });
    cy.byTestSelector('details-item-value__Name')
      .should('be.visible')
      .contains(deploymentName);
  }

  deleteBucketClaim() {
    cy.byTestID('loading-indicator').should('not.exist');
    cy.byLegacyTestID('details-actions')
      .byLegacyTestID('actions-menu-button')
      .should('be.visible')
      .click();
    cy.byLegacyTestID('details-actions')
      .byLegacyTestID('action-items')
      .should('be.visible');
    cy.byTestActionID('Delete Object Bucket Claim')
      .should('be.visible')
      .should('be.enabled')
      .click();
    cy.byTestID('confirm-action')
      .should('be.visible')
      .click();
  }
}
