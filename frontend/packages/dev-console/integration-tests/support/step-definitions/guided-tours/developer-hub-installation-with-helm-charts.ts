import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenuPO,
  quickSearchAddPO,
  quickStartCard,
  quickStartLeaveModalPO,
  quickStartSidebarPO,
} from '../../pageObjects';
import { app } from '../../pages';

Given('Build with guided documentation card is present in Add page', () => {
  cy.byTestID('card quick-start').should('be.visible');
});

When('user click on Add to project icon', () => {
  cy.get(quickSearchAddPO.quickSearchButton).click();
});

When('user clicks on Start button from the quick search result', () => {
  cy.get(quickSearchAddPO.quickSearchCreateButton).click();
});

When('user types {string} in input box', (tourName: string) => {
  cy.get(quickSearchAddPO.quickSearchInput).type(tourName);
});

When(
  'user see the tour will start with link to four steps present as a sidepane with close button',
  () => {
    cy.get(quickStartSidebarPO.quickStartSidebar).should('be.visible');
    cy.get('[class*="quick-start-task-header__title"]').then(($elements) => {
      return $elements.length === 3;
    });
  },
);

When(
  'user clicks on the {string} link on the card to see the tour will start with link to four steps present as a sidepane with close button',
  (tourName: string) => {
    cy.get(quickStartCard(tourName)).click();
    cy.get(quickStartSidebarPO.quickStartSidebar).contains(tourName);
    cy.get('[class*="quick-start-task-header__title"]').then(($elements) => {
      return $elements.length === 4;
    });
    cy.get(quickStartSidebarPO.closePanel).should('be.visible');
  },
);

When(
  'user clicks on the "Start" tour option to see {string} step to install Red Hat Developer Hub',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.startButton).click();
    cy.get(quickStartSidebarPO.quickStartSidebar).get('h3').contains(stepName);
    cy.byLegacyTestID('quick-start-task-subtitle').contains('1 of 4');
  },
);

When('user clicks on next button twice', () => {
  cy.get(quickStartSidebarPO.nextButton).click();
  app.waitForLoad();
  cy.get(quickStartSidebarPO.nextButton).click();
});

When('user clicks on next button', () => {
  cy.get(quickStartSidebarPO.nextButton).click();
});

When(
  'user selects Yes option for alert titled {string} asking to {string}',
  (alert: string, message: string) => {
    cy.byTestID('quickstart drawer').contains(alert);
    cy.byTestID('quickstart drawer').contains(message);
    cy.get(quickStartSidebarPO.yesOptionCheckInput).click();
  },
);

When('user selects Yes option on alert titled {string}', (alert: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).contains(alert);
  cy.get(quickStartSidebarPO.yesOptionCheckInput).click();
});

When(
  'user clicks on next to see {string} step started for upgrading developer installation',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.nextButton).click();
    cy.get(quickStartSidebarPO.quickStartSidebar).get('h3').contains(stepName);
  },
);

When(
  'user clicks on next to see {string} optional step to modify developer hub instance URL',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.nextButton).click();
    cy.get(quickStartSidebarPO.quickStartSidebar).get('h3').contains(stepName);
  },
);

When(
  'user clicks on next to see {string} optional step to add developer hub to Openshift Console menu',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.nextButton).click();
    cy.get(quickStartSidebarPO.quickStartSidebar).get('h3').contains(stepName);
  },
);

When('user clicks on next to see next step {string} started', (stepName: string) => {
  cy.get(quickStartSidebarPO.nextButton).click();
  cy.get(quickStartSidebarPO.quickStartSidebar).get('h3').contains(stepName);
});

When('user sees the message saying {string}', (message: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).contains(message);
});

When('user sees "Close", "Back" and "Restart"', () => {
  cy.get(quickStartSidebarPO.closePanel).should('be.visible');
  cy.get(quickStartSidebarPO.backButton).should('be.visible');
  cy.get(quickStartSidebarPO.restartSideNoteAction).should('be.visible');
});

When('user clicks on the link {string} on the card', (link: string) => {
  cy.byTestID('item all-quick-starts').contains(link).click();
});

When(
  'user sees Complete label marked on {string} card after clicking on "close" button to close the sidepane',
  (tourName: string) => {
    cy.get(quickStartSidebarPO.closePanel).click();
    cy.get(quickStartCard(tourName)).byTestID('status').contains('Complete');
  },
);

When('user clicks on the link {string} on the card', (linkString: string) => {
  cy.byTestID('item all-quick-starts').contains(linkString).click();
});

Given('user is at Quick Starts catalog page', () => {
  cy.get(devNavigationMenuPO.add).click();
  cy.byTestID('item all-quick-starts').click();
});

When('user clicks on the Start tour option to see {string} step is started', (stepName: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).contains(stepName);
  cy.get(quickStartSidebarPO.quickStartSidebar).byTestID('Start button').click();
});

When('user clicks on the {string} card', (tourName: string) => {
  cy.reload();
  cy.get(quickStartCard(tourName)).click('topRight');
});

When(
  'user selects No option on alert appears "Check your work" asking to verify that your application was successfully created',
  () => {
    cy.get(quickStartSidebarPO.noOptionCheckInput).click();
  },
);

Then('user sees that the alert is saying {string}', (alert: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).contains(alert);
});

When('user clicks "close" button to close the sidepane back to tour page', () => {
  cy.byTestID('Close button').click();
});

When('user sees alert titled {string} asking to {string}', (alert: string, message: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).contains(alert);
  cy.get(quickStartSidebarPO.quickStartSidebar).contains(message);
});

When('user clicks back button to go back to previous step', () => {
  cy.get(quickStartSidebarPO.backButton).click();
});

When('user clicks on Close button', () => {
  cy.byTestID('Close button').click();
});

Then('user sees Complete label marked on {string} card', (tourName: string) => {
  cy.get(quickStartCard(tourName)).byTestID('status').contains('Complete');
});

When('user closes the close button', () => {
  cy.get(quickStartSidebarPO.closePanel).click();
});

When('user clicks on Leave button on modal {string}', (modelString: string) => {
  cy.get('[role="dialog"]').contains(modelString);
  cy.get(quickStartLeaveModalPO.leaveButton).click();
});

Then(
  'user sees that the tour has started again with Yes option selected for the alert titled {string} in step 1',
  (alert: string) => {
    cy.byLegacyTestID('quick-start-task-subtitle').contains('1 of 4');
    cy.get(quickStartSidebarPO.quickStartSidebar).contains(alert);
    cy.get(quickStartSidebarPO.yesOptionCheckInput).should('be.checked');
  },
);

When(
  'user clicks on third step {string} from the link to four steps present in the card',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.quickStartSidebar).contains('h3', stepName).click();
  },
);

When('user clicks on second step {string}', (stepName: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).contains('h3', stepName).click();
});

When('user clicks on first step {string} step', (stepName: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).contains('h3', stepName).click();
});

When(
  'user clicks on next to see step {string} with {string} alert',
  (stepName: string, alert: string) => {
    cy.get(quickStartSidebarPO.nextButton).click();
    cy.get(quickStartSidebarPO.quickStartSidebar).contains('h3', stepName);
    cy.get(quickStartSidebarPO.quickStartSidebar).contains(alert);
  },
);

When(
  'user clicks on next to see step {string} with {string} alert',
  (stepName: string, alert: string) => {
    cy.get(quickStartSidebarPO.nextButton).click();
    cy.get(quickStartSidebarPO.quickStartSidebar).contains('h3', stepName);
    cy.get(quickStartSidebarPO.quickStartSidebar).contains(alert);
  },
);

When('user selects Yes option in alert titled {string}', (title: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar).contains(title);
});
