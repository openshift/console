import { listPage } from '../../../integration-tests-cypress/views/list-page';
import { modal } from '../../../integration-tests-cypress/views/modal';

export const createCatalogSource = (operatorName: string, catalogSourceName: string) => {
  cy.log('navigate to OperatorHub > Sources');
  cy.visit('/k8s/cluster/config.openshift.io~v1~OperatorHub/cluster/sources');
  cy.log('navigate to the CatalogSource creation form');
  cy.byTestID('item-create').click();
  cy.byTestID('create-catalogsource-title').should('exist');
  cy.byTestID('catalog-source-name').type(catalogSourceName);
  cy.byTestID('catalog-source-image').type(
    'quay.io/operator-framework/upstream-community-operators@sha256:cc7b3fdaa1ccdea5866fcd171669dc0ed88d3477779d8ed32e3712c827e38cc0',
  );
  cy.byTestID('save-changes').click();
  cy.log('verify the CatalogSource is READY');
  cy.visit('/k8s/cluster/config.openshift.io~v1~OperatorHub/cluster/sources');
  cy.byLegacyTestID(catalogSourceName).should('exist');
  cy.byTestID(`${catalogSourceName}-status`, { timeout: 90000 }).should('have.text', 'READY');
  cy.visit(
    `/k8s/ns/openshift-marketplace/operators.coreos.com~v1alpha1~CatalogSource/${catalogSourceName}/operators?packagemanifest-name=${operatorName}`,
  );
  cy.get('.co-clusterserviceversion-logo__name__clusterserviceversion', { timeout: 90000 }).should(
    'have.text',
    operatorName,
  );
};

export const deleteCatalogSource = (catalogSourceName: string) => {
  cy.visit('/k8s/cluster/config.openshift.io~v1~OperatorHub/cluster/sources');
  cy.log('Delete the CatalogSource');
  listPage.rows.clickKebabAction(catalogSourceName, 'Delete CatalogSource');
  modal.shouldBeOpened();
  modal.modalTitleShouldContain('Delete CatalogSource?');
  cy.byTestID('delete-catalogsource-input').type(catalogSourceName);
  modal.submit();
  modal.shouldBeClosed();
};
