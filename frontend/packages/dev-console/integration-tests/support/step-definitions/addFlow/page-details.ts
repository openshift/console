import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu, switchPerspective, addOptions } from '../../constants';
import { addPagePO, operatorsPO } from '../../pageObjects';
import {
  navigateTo,
  perspective,
  addPage,
  operatorsPage,
  gitPage,
  verifyAddPage,
} from '../../pages';

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
  'page contains Import From Git, Container Image, YAML, From Catalog, Database, Helm Chart cards',
  () => {
    addPage.verifyCard(addOptions.ImportFromGit);
    addPage.verifyCard(addOptions.ContainerImage);
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

Then(
  'user will see Create Application using Samples, Build with guided documentation and Explore new developer features under Getting started resources section',
  () => {
    cy.get(addPagePO.gettingStarted).should('be.visible');
    cy.byTestID('card samples').should('be.visible');
    cy.byTestID('card quick-start').should('be.visible');
    cy.byTestID('card developer-features').should('be.visible');
  },
);

Then(
  'user will see All services, Database, Operator Backed and Helm Chart options under Developer Catalog section',
  () => {
    verifyAddPage.verifyAddPageCard('Software Catalog');
    verifyAddPage.verifyAddPageCard('All services');
    verifyAddPage.verifyAddPageCard('Database');
    verifyAddPage.verifyAddPageCard('Operator Backed');
    verifyAddPage.verifyAddPageCard('Helm Chart');
  },
);

Then('user will see Import from Git card under Git Repository section', () => {
  verifyAddPage.verifyAddPageCard('Git Repository');
  verifyAddPage.verifyAddPageCard('Import from Git');
});

Then('user will see Import YAML, Upload JAR file under From Local Machine section', () => {
  verifyAddPage.verifyAddPageCard('Import YAML');
  verifyAddPage.verifyAddPageCard('Upload JAR file');
  verifyAddPage.verifyAddPageCard('From Local Machine');
});

Then('user will see {string} card', (addPageCard: string) => {
  verifyAddPage.verifyAddPageCard(addPageCard);
});

Then('user will see {string} option', (addPageOption: string) => {
  verifyAddPage.verifyAddPageCard(addPageOption);
});

Given('add page Details toggle shows {string}', (label: string) => {
  // Just waiting until the switch with all options is shown.
  // This doesn't ensure that the right label is shown because its hidden via CSS!
  cy.get(addPagePO.detailsOnOffSwitch).find('span').should('contain', label);
  // Check the checkbox checked value and change it if needed.
  cy.get(addPagePO.detailsOnOffSwitch).then((s) => {
    const toggleIsChecked = s.find('input:checked').length > 0;
    const toggleShouldBeChecked = label === 'Details on';
    cy.log(`toggleIsChecked: ${toggleIsChecked}, toggleShouldBeChecked: ${toggleShouldBeChecked}`);
    if (toggleIsChecked !== toggleShouldBeChecked) {
      cy.get(addPagePO.detailsOnOffSwitch).click();
    }
  });
});

When('user clicks Details toggle', () => {
  cy.get(addPagePO.detailsOnOffSwitch).click();
});

Then('user will see Detail toggle label {string}', (label: string) => {
  cy.get(addPagePO.detailsOnOffSwitch)
    // find both switch labels (one for checked=on and one for unchecked=off)
    .find('span')
    // they are hidden via a CSS rule like
    // .pf-v5-c-switch__input:not(:checked)~.pf-m-on { display: none; }
    // .pf-v5-c-switch__input:checked~.pf-m-off { display: none; }
    .filter((_, element) => getComputedStyle(element).display !== 'none')
    .should('contain', label);
});

Then('user will not see description of option on cards', () => {
  cy.get(addPagePO.cardDetails).should('not.exist');
});

Then('user will see description of each option on each card', () => {
  cy.get(addPagePO.cardDetails).should('have.length.at.least', 5);
});

Given('user has hidden Getting Started Resources from View', () => {
  cy.get('.ocs-getting-started-expandable-section').then(($el) => {
    if ($el.hasClass('pf-m-expanded')) {
      cy.get(addPagePO.toogleGettingStarted).click();
    } else {
      cy.log('Getting Started card is hidden');
    }
  });
});

Given('user has Getting Started Resources shown in Add page', () => {
  cy.get('.ocs-getting-started-expandable-section').then(($el) => {
    if ($el.hasClass('pf-m-expanded')) {
      cy.log('Getting Started card can be seen');
    } else {
      cy.get(addPagePO.toogleGettingStarted).click();
    }
  });
});

Then('user will not see Getting started resources card', () => {
  cy.get(addPagePO.gettingStarted).parent().should('have.attr', 'hidden');
});

When('user clicks on Show getting started resources link', () => {
  cy.get(addPagePO.toogleGettingStarted).click();
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
