import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { detailsPage } from '../../../integration-tests-cypress/views/details-page';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { nav } from '../../../integration-tests-cypress/views/nav';

const catalogSource = 'redhat-operators';

describe(`Interacting with CatalogSource page`, () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
  });

  beforeEach(() => {
    cy.log('navigate to Catalog Source page');
    cy.visit(`/settings/cluster`);
    cy.byLegacyTestID('horizontal-link-Configuration').click();
    cy.byLegacyTestID('OperatorHub').click();

    // verfiy operatorHub details page is open
    detailsPage.sectionHeaderShouldExist('OperatorHub details');
    cy.byLegacyTestID('horizontal-link-Sources').click();
    cy.byLegacyTestID(catalogSource).click();

    // verfiy catalogSource details page is open
    detailsPage.sectionHeaderShouldExist('CatalogSource details');
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`renders details about the ${catalogSource} catalog source`, () => {
    // validate Name field
    cy.byTestSelector('details-item-label__Name').should('be.visible');
    cy.byTestSelector('details-item-value__Name').should('have.text', catalogSource);

    // validate Status field
    cy.byTestSelector('details-item-label__Status').should('be.visible');
    cy.byTestSelector('details-item-value__Status').should('have.text', 'READY');

    // validate DisplayName field
    cy.byTestSelector('details-item-label__Display name').should('be.visible');
    cy.byTestSelector('details-item-value__Display name').should('have.text', 'Red Hat Operators');

    // validate RegistryPollInterval field
    cy.byTestID('Registry poll interval')
      .scrollIntoView()
      .should('be.visible');
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

  it('allows modifying registry poll interval', () => {
    cy.byTestID('Registry poll interval-details-item__edit-button').click();
    modal.modalTitleShouldContain('Edit registry poll interval');
    cy.byLegacyTestID('dropdown-button').click();
    cy.byTestDropDownMenu('30m0s').click();
    modal.submit();

    // verify that registryPollInterval is updated
    cy.byTestSelector('details-item-value__Registry poll interval').should('have.text', '30m0s');
  });

  it(`lists all the package manifests for ${catalogSource} under Operators tab`, () => {
    cy.byLegacyTestID('horizontal-link-olm~Operators').click();
    cy.get('[data-label=Name]').should('exist');
  });
});
