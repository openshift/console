import { checkErrors, create, testName } from '../../../integration-tests-cypress/support';
import { detailsPage } from '../../../integration-tests-cypress/views/details-page';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { testCatalogSource } from '../mocks';

const managedCatalogSource = {
  name: 'redhat-operators',
  displayName: 'Red Hat Operators',
};

describe(`Interacting with CatalogSource page`, () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
    create(testCatalogSource);
  });

  beforeEach(() => {
    cy.log('navigate to Catalog Source page');
    nav.sidenav.clickNavLink(['Administration', 'Cluster Settings']);
    cy.byLegacyTestID('horizontal-link-Configuration').click();
    cy.byTestID('loading-indicator').should('not.exist');
    cy.byLegacyTestID('OperatorHub').scrollIntoView().click();

    // verfiy operatorHub details page is open
    detailsPage.sectionHeaderShouldExist('OperatorHub details');

    // navigate to Catalog Sources list
    cy.byLegacyTestID('horizontal-link-Sources').click();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`renders details about the ${managedCatalogSource.name} catalog source`, () => {
    cy.byLegacyTestID(managedCatalogSource.name).click();

    // verfiy catalogSource details page is open
    detailsPage.sectionHeaderShouldExist('CatalogSource details');

    // verify catalogSource/redhat-operators' is READY
    cy.byTestSelector('details-item-value__Status', { timeout: 300000 }).should(
      'have.text',
      'READY',
    ); // 5 mins

    // validate Name field
    cy.byTestSelector('details-item-label__Name').should('be.visible');
    cy.byTestSelector('details-item-value__Name').should('have.text', managedCatalogSource.name);

    // validate Status field
    cy.byTestSelector('details-item-label__Status').should('be.visible');

    // validate DisplayName field
    cy.byTestSelector('details-item-label__Display name').should('be.visible');
    cy.byTestSelector('details-item-value__Display name').should(
      'have.text',
      managedCatalogSource.displayName,
    );

    // validate RegistryPollInterval field
    cy.byTestID('Registry poll interval').scrollIntoView().should('be.visible');
    cy.byTestSelector('details-item-value__Registry poll interval')
      .scrollIntoView()
      .should('be.visible');

    // validate NumberOfOperators field
    cy.byTestSelector('details-item-label__Number of Operators')
      .scrollIntoView()
      .should('be.visible');
    cy.byTestSelector('details-item-value__Number of Operators')
      .scrollIntoView()
      .should('be.visible');
  });

  it(`lists all the package manifests for ${managedCatalogSource.name} under Operators tab`, () => {
    cy.byLegacyTestID(managedCatalogSource.name).click();

    // verfiy catalogSource details page is open
    detailsPage.sectionHeaderShouldExist('CatalogSource details');

    cy.byLegacyTestID('horizontal-link-Operators').click();
    cy.get('[data-label=Name]').should('exist');
  });

  it(`allows modifying registry poll interval on test catalog source`, () => {
    cy.byLegacyTestID(testCatalogSource.metadata.name).click();

    cy.byTestID('Registry poll interval-details-item__edit-button').click();
    modal.modalTitleShouldContain('Edit registry poll interval');
    cy.byLegacyTestID('dropdown-button').click();
    cy.byTestDropDownMenu('30m').should('be.visible').click();
    modal.submit();

    // verify that registryPollInterval is updated
    cy.byTestSelector('details-item-value__Registry poll interval').should('have.text', '30m');
  });
});
