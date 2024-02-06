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
  'user sees the tour will start with a link to the three steps present as a sidebar with a start button',
  () => {
    cy.get(quickStartSidebarPO.quickStartSidebar).should('be.visible');
    cy.get('[class*="quick-start-task-header__title"]').then(($elements) => {
      return $elements.length === 3;
    });
  },
);

When(
  'user clicks on the {string} link on the card to see the tour will start with link to three steps present as a sidepane with close button',
  (tourName: string) => {
    cy.get(quickStartCard(tourName)).click();
    cy.byTestID('quickstart drawer').contains(tourName);
    cy.get('[class*="quick-start-task-header__title"]').then(($elements) => {
      return $elements.length === 3;
    });
    cy.get(quickStartSidebarPO.closePanel).should('be.visible');
  },
);

When(
  'user clicks on the Start button to see {string} step for installing serverless steps',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.startButton).click();
    cy.byTestID('quickstart drawer').get('h3').contains(stepName);
    cy.byLegacyTestID('quick-start-task-subtitle').contains('1 of 3');
  },
);

When('user clicks on next button twice', () => {
  cy.get(quickStartSidebarPO.nextButton).click();
  app.waitForLoad();
  cy.get(quickStartSidebarPO.nextButton).click();
});

When('user clicks on next button', () => {
  cy.get(quickStartSidebarPO.nextButton).should('be.visible').click();
});

When(
  'user clicks on next to see an alert appears {string} asking to verify that the Serverless Operator was successfully installed',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.nextButton).should('be.visible').click();
    cy.byTestID('quickstart drawer').contains(stepName);
  },
);

When(
  'user clicks on next to see an alert appears {string} step to create the Knative Serving application program interface',
  (stepName: string) => {
    cy.byTestID('quickstart drawer').contains(stepName);
  },
);

When(
  'user clicks on next to see {string} step to create the Knative Serving application program interface',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.nextButton).should('be.visible').click();
    cy.byTestID('quickstart drawer').get('h3').contains(stepName);
  },
);

When(
  'user clicks on next to see {string} step to create the Knative Eventing application program interface',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.nextButton).should('be.visible').click();
    cy.byTestID('quickstart drawer').get('h3').contains(stepName);
  },
);

When('user sees the message saying {string}', (message: string) => {
  cy.byTestID('quickstart drawer').contains(message);
});

When('user sees "Close", "Back" and "Restart"', () => {
  cy.get(quickStartSidebarPO.closePanel).should('be.visible');
  cy.get(quickStartSidebarPO.backButton).should('be.visible');
  cy.get(quickStartSidebarPO.restartSideNoteAction).should('be.visible');
});

When('user sees Complete label marked on {string} card', (tourName: string) => {
  cy.get(quickStartCard(tourName)).byTestID('status').contains('Complete');
});

When('user clicks on the link {string} on the card', (link: string) => {
  cy.byTestID('item all-quick-starts').contains(link).click();
});

When(
  'user selects Yes option for alert titled {string} asking to {string}',
  (alert: string, promptMessage: string) => {
    cy.byTestID('quickstart drawer').contains(alert);
    cy.byTestID('quickstart drawer').contains(promptMessage);
    cy.get(quickStartSidebarPO.yesOptionCheckInput).click();
  },
);

Then('user clicks "Restart" to reset the guided documentation status', () => {
  cy.byTestID('quickstart drawer').get(quickStartSidebarPO.restartSideNoteAction).click();
});

Given('user is at Quick Starts catalog page', () => {
  cy.get(devNavigationMenuPO.add).click();
  cy.byTestID('item all-quick-starts').click();
});

When('user clicks on the {string} card', (tourName: string) => {
  cy.reload();
  cy.get(quickStartCard(tourName)).click('topRight');
});

When('user clicks on the Start tour option to see {string} step is started', (stepName: string) => {
  cy.byTestID('quickstart drawer').contains(stepName);
  cy.byTestID('quickstart drawer').byTestID('Start button').click();
});

When('user selects No option', () => {
  cy.get(quickStartSidebarPO.noOptionCheckInput).click();
});

Then('user sees that the alert is saying {string}', (alertString: string) => {
  cy.byTestID('quickstart drawer').contains(alertString);
});

When('user clicks on next on {string} step', (stepName: string) => {
  cy.byTestID('quickstart drawer').contains(stepName);
  cy.byLegacyTestID('quick-start-task-subtitle').should('be.visible');
  cy.get(quickStartSidebarPO.nextButton).should('be.visible').click();
});

When('user clicks on next on {string} alert', (alert: string) => {
  cy.byTestID('quickstart drawer').contains(alert);
  cy.get(quickStartSidebarPO.nextButton).should('be.visible').click();
});

When(
  'user selects Yes option for the alert {string} asking to {string}',
  (alert: string, promptMessage: string) => {
    cy.byTestID('quickstart drawer').contains(alert);
    cy.get(quickStartSidebarPO.yesOptionCheckInput).click();
    cy.byTestID('quickstart drawer').contains(promptMessage);
  },
);

When(
  'user clicks on next to see "Create the Knative Eventing API" step is started',
  (stepName: string) => {
    cy.get(quickStartSidebarPO.nextButton).should('be.visible').click();
    cy.byTestID('quickstart drawer').contains('h3', stepName);
  },
);

When('user clicks "close" button to close the sidepane', () => {
  cy.get(quickStartSidebarPO.closePanel).click();
});

When(
  'user sees alert titled {string} asking to {string}',
  (alert: string, promptMessage: string) => {
    cy.byTestID('quickstart drawer').contains(alert);
    cy.byTestID('quickstart drawer').contains(promptMessage);
  },
);

When('user clicks "Back" button to go back to previous {string} alert', (alert: string) => {
  cy.get(quickStartSidebarPO.backButton).click();
  cy.byTestID('quickstart drawer').contains(alert);
});

When('user clicks "close" button to close the sidepane back to tour page', () => {
  cy.byTestID('Close button').click();
});

Then('user sees Complete label marked on {string} card', (tourName: string) => {
  cy.get(quickStartCard(tourName)).byTestID('status').contains('Complete');
});

When('user sees {string} step is started', (stepName: string) => {
  cy.byTestID('quickstart drawer').contains('h3', stepName);
});

When('user closes the close button', () => {
  cy.get(quickStartSidebarPO.closePanel).click();
});

When('user clicks on Leave button on modal {string}', (modelString: string) => {
  cy.get('[role="dialog"]').contains(modelString);
  cy.get(quickStartLeaveModalPO.leaveButton).click();
});

Then('user sees the tour will start from the step {string}', (stepName: string) => {
  cy.byTestID('content').contains(stepName);
  cy.byLegacyTestID('quick-start-task-subtitle').contains('1 of 3');
});

When('user clicks on the Restart button', () => {
  cy.get(quickStartSidebarPO.restartSideNoteAction).click();
});

Then('user sees that the tour has started again', () => {
  cy.byTestID('quickstart drawer').contains('In this quick start, you will complete 3 task');
  cy.get(quickStartSidebarPO.startButton).should('be.visible');
  cy.get(quickStartSidebarPO.nextButton).should('not.exist');
  cy.get(quickStartSidebarPO.closeButton).should('not.exist');
});

When('user clicks on first step {string}', (stepName: string) => {
  cy.byTestID('quickstart drawer').contains('h3', stepName).click();
});

Then('user sees step {string} with Check your work alert', (stepName: string) => {
  cy.byTestID('quickstart drawer').contains('h3', stepName);
  cy.byLegacyTestID('quick-start-task-subtitle').contains('2 of 3');
  cy.get('[role="alert"]').contains('Check your work');
});
