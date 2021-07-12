import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  addPagePO,
  quickStartCard,
  quickStartLeaveModalPO,
  quickStartSidebarPO,
  quickStartsPO,
} from '../../pageObjects';
import { app, quickStartsPage } from '../../pages';

let quickStartLink: string;

Then('user can see Build with guided documentation card', () => {
  cy.get(addPagePO.buildWithGuidedDocumentation).should('be.visible');
});

Then('user can see two Quick Starts link present on it', () => {
  cy.get(addPagePO.buildWithGuidedDocumentationItems).should('have.length', 2 + 1); // +1 represents View all quick start link displaying with the quick start links
});

Then('user can see the "View all quick starts" on the card', () => {
  cy.get(addPagePO.viewAllQuickStarts).should('be.visible');
});

When('user clicks on the "View all quick starts" on Build with guided documentation card', () => {
  cy.get(addPagePO.viewAllQuickStarts)
    .should('be.visible')
    .click();
});

Then(
  'user can see {string}, {string} and {string} Quick Starts',
  (quickStartDisplayName1, quickStartDisplayName2, quickStartDisplayName3) => {
    cy.get(quickStartCard(quickStartDisplayName1)).should('be.visible');
    cy.get(quickStartCard(quickStartDisplayName2)).should('be.visible');
    cy.get(quickStartCard(quickStartDisplayName3)).should('be.visible');
  },
);

Then('user can see time taken to complete the tour on the card', () => {
  cy.get(quickStartCard('Get started with a sample application'))
    .find(quickStartsPO.duration)
    .should('be.visible');
  cy.get(quickStartCard('Install the OpenShift Pipelines Operator'))
    .find(quickStartsPO.duration)
    .should('be.visible');
  cy.get(quickStartCard('Add health checks to your sample application'))
    .find(quickStartsPO.duration)
    .should('be.visible');
});

Given('user is at Quick Starts catalog page', () => {
  quickStartsPage.quickStartsCatalog();
});

Given('user has completed {string} Quick Start', (quickStartDisplayName: string) => {
  quickStartsPage.executeQuickStart(quickStartCard(quickStartDisplayName));
});

Then(
  'user can see time taken to complete the {string} tour on the card',
  (quickStartDisplayName: string) => {
    cy.get(quickStartCard(quickStartDisplayName))
      .find(quickStartsPO.duration)
      .should('be.visible');
  },
);

Then('user can see Complete label on {string} card', (quickStartDisplayName: string) => {
  cy.get(quickStartCard(quickStartDisplayName))
    .parent()
    .find(quickStartsPO.cardStatus)
    .should('be.visible')
    .contains('Complete');
});

Given('user is at Quick Starts catalog page', () => {
  quickStartsPage.quickStartsCatalog();
});

Given('user has not completed {string} Quick Start', (quickStartDisplayName: string) => {
  quickStartsPage.leaveQuickStartIncomplete(quickStartCard(quickStartDisplayName));
});

Then(
  'user can see time taken to complete the {string} tour on the card',
  (quickStartDisplayName: string) => {
    cy.get(quickStartCard(quickStartDisplayName))
      .find(quickStartsPO.duration)
      .should('be.visible');
  },
);

Then('user can see In Progress label on {string} card', (quickStartDisplayName: string) => {
  cy.get(quickStartCard(quickStartDisplayName))
    .parent()
    .find(quickStartsPO.cardStatus)
    .should('be.visible')
    .contains('In progress');
});

When('user clicks on first Quick Starts link on the Build with guided documentation card', () => {
  cy.get(addPagePO.buildWithGuidedDocumentationItems)
    .first()
    .then(($link) => {
      quickStartLink = $link.get(0).innerText;
    });
  cy.get(addPagePO.buildWithGuidedDocumentationItems)
    .first()
    .click();
  cy.get(quickStartSidebarPO.quickStartSidebarBody).should('be.visible');
});

When('user clicks on the Start button', () => {
  cy.get(quickStartSidebarPO.quickStartSidebarBody)
    .find(quickStartSidebarPO.startButton)
    .click();
});

When('user clicks on close button', () => {
  cy.get(quickStartSidebarPO.closePanel)
    .should('be.visible')
    .click();
});

When('user clicks on Leave button in the Leave the tour modal box', () => {
  cy.get(quickStartLeaveModalPO.leaveModal).should('be.visible');
  cy.get(quickStartLeaveModalPO.leaveButton)
    .should('be.visible')
    .click();
});

Then('user can see the first Quick Starts link', () => {
  cy.get(addPagePO.buildWithGuidedDocumentationItems)
    .first()
    .should('have.text', quickStartLink);
});

Given('user is at Quick Starts catalog page', () => {
  quickStartsPage.quickStartsCatalog();
});

Given('user has completed {string} Quick Start', (quickStartDisplayName: string) => {
  quickStartsPage.executeQuickStart(quickStartCard(quickStartDisplayName));
});

When('user clicks on Restart on {string} quick start sidebar', (quickStartDisplayName: string) => {
  cy.get(quickStartCard(quickStartDisplayName))
    .scrollIntoView()
    .click();
  app.waitForDocumentLoad();
  cy.get(quickStartSidebarPO.quickStartSidebarBody).should('be.visible');
  cy.get(quickStartSidebarPO.restartSideNoteAction)
    .should('be.visible')
    .click();
});

Then('user can see Start button', () => {
  cy.get(quickStartSidebarPO.quickStartSidebarBody)
    .find(quickStartSidebarPO.startButton)
    .should('be.visible');
});

Then('user can see {string} Steps visible for the Quick Start', (steps: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebarBody).contains(steps);
});
