import { modal } from '../../../integration-tests-cypress/views/modal';
import { listPage } from '../../../integration-tests-cypress/views/list-page';

const verifyPackageManifest = (opName: string, csName: string, depth: number = 0) => {
  // prevent infinite recursion of verifyPackageManifest
  expect(depth).toBeLessThan(20);
  cy.log('verify the PackageManifest has been created');

  return cy
    .visit(
      `/k8s/ns/openshift-marketplace/operators.coreos.com~v1alpha1~CatalogSource/${csName}/operators?packagemanifest-name=${opName}`,
    )
    .byTestID('filter-toolbar')
    .should('exist')
    .then(() => {
      const row = Cypress.$(`[data-test-rows="resource-row"]:contains("${opName}")`);
      if (row && row.length) {
        cy.get(`[data-test-rows="resource-row"]`).contains(opName);
      } else {
        cy.log(`Did not find ${opName} in ${csName}, waiting to try again`);
        cy.wait(5000);
        verifyPackageManifest(opName, csName, depth + 1);
      }
    });
};

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
  cy.byTestID(`${catalogSourceName}-status`, { timeout: 90000 }).should('contain', 'READY');
  verifyPackageManifest(operatorName, catalogSourceName);
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
