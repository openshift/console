import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { switchPerspective } from '../../constants';
import { app, perspective } from '../../pages';

Given('user is at admin perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

Given('user is at Search page in Home section', () => {
  cy.get('[data-quickstart-id="qs-nav-home"]')
    .scrollIntoView()
    .then(($body) => {
      if ($body.attr('aria-expanded') === 'false') {
        cy.wrap($body).click();
        cy.get('[data-test="nav"][href*="/search"]').click({ force: true });
      } else {
        cy.get('[data-test="nav"][href*="/search"]').click({ force: true });
      }
    });
});

When('user searches {string}', (value: string) => {
  cy.get('[role="combobox"]').click();
  cy.get('[aria-label="Type to filter"]').should('be.visible').type(value);
  cy.get('[class="co-resource-item"]').then(($el) => {
    if ($el.text().includes('operator.openshift.io')) {
      cy.wrap($el).contains('operator.openshift.io').click();
      cy.get('button[aria-label="Clear input value"]').should('be.visible').click();
      // close the select so it doesn't block the items on the page
      cy.get('body').click();
    }
  });
});

When('user clicks on cluster', () => {
  cy.byTestID('cluster').should('be.visible').click({ force: true });
});

When('user clicks the {string} button in the page heading', (item: string) => {
  cy.get(`button[data-test-action="${item}"]`).should('be.visible').click();
  cy.get('[data-test="page-heading"] h1').should('have.text', 'Cluster configuration');
});

When(
  'user selects {string} in the Developer under perspective section of general customisation',
  (key: string) => {
    cy.get('[data-test="perspectives form-group"]')
      .eq(1)
      .find('button')
      .contains('Disabled')
      .click();
    cy.log('Perspective enabling menu to be opened');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('button[role="option"]').contains(key).click();
    cy.get('[data-test="perspectives form-group"]')
      .eq(1)
      .find('button[class*="menu-toggle"]')
      .should('contain.text', key);
  },
);

When('user will see Saved alert', () => {
  cy.byTestID('success-alert').should('be.visible');
});

Then('user refreshes the page to see developer option', () => {
  cy.exec('oc rollout status -w deploy/console -n openshift-console', {
    failOnNonZeroExit: true,
  }).then((result) => {
    cy.log(result.stderr);
  });
  cy.reload(true);
  app.waitForDocumentLoad();
});

Then('user will see developer perspective in the perspective switcher', () => {
  cy.byLegacyTestID('perspective-switcher-toggle')
    .click({ force: true })
    .byLegacyTestID('perspective-switcher-menu-option')
    .contains('Developer');
});
