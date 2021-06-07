import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  navigateTo,
  perspective,
  addPage,
  operatorsPage,
  gitPage,
  verifyAddPage,
} from '../../pages';
import { devNavigationMenu, switchPerspective, addOptions } from '../../constants';
import { addPagePO, operatorsPO } from '../../pageObjects';

Given('cluster is not installed with any operators', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  cy.get(operatorsPO.installOperators.noOperatorFoundMessage).should(
    'have.text',
    'No Operators Found',
  );
});

When('user selects Add option from left side navigation menu', () => {
  navigateTo(devNavigationMenu.Add);
});

Then(
  'page contains From Git, Container Image, From Dockerfile, YAML, From Catalog, Database, Helm Chart cards',
  () => {
    addPage.verifyCard(addOptions.Git);
    addPage.verifyCard(addOptions.ContainerImage);
    addPage.verifyCard(addOptions.DockerFile);
    addPage.verifyCard(addOptions.YAML);
    addPage.verifyCard(addOptions.DeveloperCatalog);
    addPage.verifyCard(addOptions.Database);
    addPage.verifyCard(addOptions.HelmChart);
  },
);

Then('user is able to see message {string} on Add page', (message: string) => {
  gitPage.verifyNoWorkLoadsText(message);
});

Then('user is able to see Pipeline card on Git form', () => {
  addPage.verifyCard('Pipeline');
});

Then('user is able to see {string} card on Add page', (cardName: string) => {
  addPage.verifyCard(cardName);
});

Then('user will see Getting started resources', () => {
  cy.get(addPagePO.gettingStarted).should('be.visible');
});

Then('user will see Create Application using Samples', () => {
  cy.byTestID('card samples').should('be.visible');
});

Then('user will see Build with guided documentation', () => {
  cy.byTestID('card quick-start').should('be.visible');
});

Then('user will see Explore new developer features', () => {
  cy.byTestID('card developer-features').should('be.visible');
});

Then('user will see {string} card', (addPageCard: string) => {
  verifyAddPage.verifyAddPageCard(addPageCard);
});

Then('user will see {string} option', (addPageOption: string) => {
  verifyAddPage.verifyAddPageCard(addPageOption);
});

When('user enable Details toggle', () => {
  if (cy.get(addPagePO.detailsOnOffText).contains('Details on')) {
    cy.log('Details are on');
  } else {
    cy.get(addPagePO.detailsOnOffSwitch).click();
  }
});

Then('user will see label Details on', () => {
  cy.get(addPagePO.detailsOnOffText).should('contain', 'Details on');
});

Then('user will see description of each option on each card', () => {
  cy.get(addPagePO.cardDetails).should('have.length.at.least', 5);
});

When('user disable Details toggle', () => {
  if (cy.get(addPagePO.detailsOnOffText).contains('Details on')) {
    cy.get(addPagePO.detailsOnOffSwitch).click();
  } else {
    cy.log('Details are off');
  }
});

Then('user will see label Details off', () => {
  cy.get(addPagePO.detailsOnOffText).should('contain', 'Details off');
});

Then('user will not see description of option on cards', () => {
  cy.get(addPagePO.cardDetails).should('not.exist');
  cy.clearLocalStorage();
});

Given('user has hidden Getting Started Resources from View', () => {
  if (cy.get(addPagePO.gettingStarted)) {
    cy.log('Getting started resources is present');
  } else {
    cy.get(addPagePO.restoreGettingStarted).click();
  }
});

When('user selects Hide from view option from kebab menu', () => {
  if (cy.get(addPagePO.gettingStarted)) {
    cy.get(addPagePO.kebabMenuGettingStarted).click();
    cy.get(addPagePO.hideGettingStarted).click();
  } else {
    cy.get(addPagePO.restoreGettingStarted).click();
    cy.get(addPagePO.kebabMenuGettingStarted).click();
    cy.get(addPagePO.hideGettingStarted).click();
  }
});

Then('user will not see Getting started resources card', () => {
  cy.get(addPagePO.gettingStarted).should('not.exist');
});

When('user clicks on Show getting started resources link', () => {
  cy.get(addPagePO.restoreGettingStarted).click();
});

Then('user will see Getting started resources card', () => {
  cy.get(addPagePO.gettingStarted).should('be.visible');
});

When('user clicks on close Show getting started resources link', () => {
  cy.get(addPagePO.closeButton).click();
});

Then('user will not see Show getting started resources link', () => {
  cy.get(addPagePO.restoreGettingStarted).should('not.exist');
});
