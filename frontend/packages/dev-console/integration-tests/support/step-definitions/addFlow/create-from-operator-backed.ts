import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { operators } from '@console/dev-console/integration-tests/support/constants/global';
import { verifyAndInstallOperator } from '@console/dev-console/integration-tests/support/pages';
import {
  catalogTypes,
  devNavigationMenu,
  addOptions,
  pageTitle,
  catalogCards,
  switchPerspective,
} from '../../constants';
import { catalogPO } from '../../pageObjects';
import { perspective, catalogPage, addPage, navigateTo, topologyPage } from '../../pages';

const d = new Date();
const timestamp = d.getTime();

Given('Operator Backed is selected on Developer Catalog page', () => {
  catalogPage.selectCatalogType(catalogTypes.OperatorBacked);
});

Given('user is at OperatorBacked page', () => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.OperatorBacked);
});

When('user selects knative Serving card', () => {
  catalogPage.selectKnativeServingCard();
});

When('user clicks Create button in side bar', () => {
  catalogPage.clickButtonOnCatalogPageSidePane();
});

When('user enters name as {string} in Create knative Serving page', (name: string) => {
  cy.get(catalogPO.createKnativeServing.logo).should('be.visible');
  cy.get(catalogPO.createKnativeServing.name)
    .clear()
    .type(name);
});

When('user clicks create button in Create knative Serving page', () => {
  cy.get('button[type="submit"]').click();
});

When('user clicks cancel button in Create knative Serving page', () => {
  cy.get(catalogPO.createKnativeServing.logo).should('be.visible');
  cy.byButtonText('Cancel').click();
});

Then(
  'user is able to see workload {string} in topology page from knative Serving page',
  (name: string) => {
    topologyPage.verifyWorkloadInTopologyPage(`${name}-${timestamp}`);
  },
);

Then('user will be redirected to Developer Catalog page', () => {
  detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
});

When('user selects knative Kafka card', () => {
  catalogPage.selectCardInCatalog(catalogCards.knativeKafka);
});

Given('user has installed Service Binding operator', () => {
  verifyAndInstallOperator(operators.ServiceBinding);
});

Given('user has installed Crunchy Postgres for Kubernetes operator', () => {
  verifyAndInstallOperator(operators.CrunchyPostgresforKubernetes);
});

Given('user enters {string} in Filter by keyword', (filterName: string) => {
  cy.get(catalogPO.filterKeyword)
    .scrollIntoView()
    .click();
  cy.get(catalogPO.filterKeyword).type(filterName);
});

Then(
  'user will see {string} label associated with {string} card',
  (labelName: string, catalogName: string) => {
    cy.get(`[data-test^="OperatorBackedService-${catalogName}"]`).within(() => {
      cy.get(catalogPO.batchLabel)
        .should('be.visible')
        .contains(labelName);
    });
  },
);

Then(
  'user will see {string} label in {string} sidebar',
  (labelName: string, catalogName: string) => {
    cy.get(`[data-test^="OperatorBackedService-${catalogName}"]`).click();
    cy.get(catalogPO.batchLabel)
      .should('be.visible')
      .contains(labelName);
  },
);

When('user selects Bindable checkbox under Service Binding', () => {
  cy.get(catalogPO.bindingFilterBindable).within(() => {
    cy.get(catalogPO.filterCheckBox).click();
  });
});

Then('user will see Bindable cards', () => {
  cy.get(catalogPO.batchLabel).should('contain.text', 'Bindable');
});

Then('user can see infotip associated with the Service Binding filter', () => {
  cy.get(catalogPO.filterInfoTip).click();
  cy.get(catalogPO.filterInfoTipContent).should('be.visible');
});
