import { checkErrors, create } from '../../../integration-tests-cypress/support';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { testDeprecatedOperatorCR } from '../mocks';

describe('Using OLM descriptor components', () => {
  beforeEach(() => {
    cy.login();
    cy.initAdmin();
    create(testDeprecatedOperatorCR);
    cy.wait(120000);
  });

  afterEach(() => {
    cy.visit('/');
    cy.exec(
      `oc delete ${testDeprecatedOperatorCR.kind} ${testDeprecatedOperatorCR.metadata.name} -n openshift-marketplace`,
    );
    checkErrors();
  });

  it('finds the Kiali Community Operator with a Deprecated badge', () => {
    cy.log('navigate to OperatorHub');
    nav.sidenav.clickNavLink(['Operators', 'OperatorHub']);
    cy.url().should('include', '/operatorhub/all-namespaces');
    cy.log('more than one tile should be present');
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);

    // eslint-disable-next-line promise/catch-or-return
    cy.get('.co-catalog-tile')
      .first()
      .then(($origCatalogTitle) => {
        const origCatalogTitleTxt = $origCatalogTitle.find('.catalog-tile-pf-title').text();
        cy.log(`Filtered tile title text is ${origCatalogTitleTxt}`);
        cy.byTestID('source-community-operators-for-testing-deprecation').click();
        cy.log('Get the Community Operators for testing deprecation');
        cy.get('.co-catalog-tile')
          .first()
          .find('.catalog-tile-pf-title')
          .invoke('text')
          .should('not.equal', origCatalogTitleTxt);
      });

    cy.log('filters Operators by name');
    const operatorName = 'kiali community operator';
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);

    cy.log('find the Kiali Community Operator with a Deprecated badge');
    cy.get('.co-catalog-tile')
      .contains('.catalog-tile-pf-title', 'Kiali Community Operator')
      .should('exist');
    cy.get('.co-catalog-tile').contains('.catalog-tile-pf-subtitle', 'Deprecated').should('exist');
    cy.get('.co-catalog-tile').click();

    // modal should be visible
    cy.byTestID('deprecated-badge').contains('Deprecated');
    cy.log('verify the channel selection is displayed');
    cy.get('.co-operator-channel__select').should('exist');

    // Click the channel selection with force and wait for the dropdown to open
    cy.get('.co-operator-channel__select').first().click({ force: true });

    cy.get('.pf-v5-c-select__toggle').children().eq(1).click({ force: true });

    cy.get('.pf-v5-c-select__menu-item').eq(1).click({ force: true });

    // Click the version selection with force and wait for the dropdown to open
    cy.get('.co-operator-version__select').first().click({ force: true });
    cy.get('.pf-v5-c-select__toggle').eq(1).click({ force: true });
    cy.get('.pf-v5-c-select__menu-item').eq(15).click({ force: true });

    cy.get('.co-operator-version__select').should('exist');

    // Click the deprecated massages for package, channel and version
    cy.byTestID('deprecated-package').contains(
      "package kiali is end of life. Please use 'kiali-new' package for support.",
    );
    cy.byTestID('deprecated-channel').contains(
      "channel alpha is no longer supported. Please switch to channel 'stable'.",
    );
    cy.byTestID('deprecated-version').contains(
      'kiali-operator.v1.68.0 is deprecated. Uninstall and install kiali-operator.v1.72.0 for support.',
    );

    cy.byLegacyTestID('operator-install-btn').click({ force: true });

    // operator install form
    cy.byTestID('deprecated-badge').contains('Deprecated');
    cy.byTestID('deprecated-package').should('exist');

    cy.log('verify the channel selection is displayed');
    cy.get('.co-operator-channel__select').should('exist');

    // Click the deprecated massages for package, channel and version
    cy.byTestID('deprecated-package').contains(
      "package kiali is end of life. Please use 'kiali-new' package for support.",
    );
    cy.byTestID('deprecated-channel').contains(
      "channel alpha is no longer supported. Please switch to channel 'stable'.",
    );
    cy.byTestID('deprecated-version').contains(
      'kiali-operator.v1.68.0 is deprecated. Uninstall and install kiali-operator.v1.72.0 for support.',
    );
  });
});
