import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { navigateTo, perspective, addPage, operatorsPage, gitPage } from '../../pages';
import { devNavigationMenu, switchPerspective, addOptions } from '../../constants';
import { operatorsPO } from '../../pageObjects';

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
