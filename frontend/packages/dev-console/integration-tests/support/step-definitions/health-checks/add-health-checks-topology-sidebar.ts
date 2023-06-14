import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { devNavigationMenu, switchPerspective } from '../../constants';
import { topologyPO } from '../../pageObjects';
import { navigateTo, perspective, topologyHelper, topologySidePane } from '../../pages';

Given('user selects type as {string}', (type: string) => {
  cy.byLegacyTestID('dropdown-button').should('be.visible').click();
  cy.get('.pf-c-dropdown__menu').find('li').contains(type).should('be.visible').click();
  cy.get('body').then(($el) => {
    if ($el.find('[data-test-id="dropdown-button"]').text().includes('Container command')) {
      cy.get('[placeholder="argument"]').should('be.visible').type('example');
    }
  });
});

When(
  'user searches and clicks on the workload {string} to open the sidebar',
  (workloadName: string) => {
    topologyHelper.search(workloadName);
    cy.get(topologyPO.highlightNode, { timeout: 5000 }).should('be.visible').click();
    topologySidePane.verify();
  },
);

When('user can see workload {string} in topology page', (name: string) => {
  topologyHelper.search(name);
  cy.get(topologyPO.highlightNode, { timeout: 5000 }).should('be.visible');
});

When(
  'user will see all 3 Probes added on the Add Health Checks page for {string} {string}',
  (type: string, name: string) => {
    cy.log(`/k8s/ns/${Cypress.env('NAMESPACE')}/${type}/${name}/containers/${name}/health-checks`);
    cy.visit(
      `/k8s/ns/${Cypress.env('NAMESPACE')}/${type}/${name}/containers/${name}/health-checks`,
    );
    detailsPage.titleShouldContain('Edit health checks');
    cy.get('.odc-heath-check-probe__successText').should('have.length', 3);
    perspective.switchTo(switchPerspective.Developer);
    guidedTour.close();
    nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
    navigateTo(devNavigationMenu.Topology);
  },
);

Then(
  'user will see {string} added on the Add Health Checks page for {string} {string}',
  (probe: string, type: string, name: string) => {
    cy.visit(
      `/k8s/ns/${Cypress.env('NAMESPACE')}/${type}/${name}/containers/${name}/health-checks`,
    );
    detailsPage.titleShouldContain('Edit health checks');
    cy.get('.odc-heath-check-probe__successText').contains(`${probe} added`).should('be.visible');
    perspective.switchTo(switchPerspective.Developer);
    guidedTour.close();
    nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
    navigateTo(devNavigationMenu.Topology);
  },
);
