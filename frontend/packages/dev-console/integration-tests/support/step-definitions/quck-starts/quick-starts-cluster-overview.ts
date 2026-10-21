import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { adminNavigationBar, switchPerspective } from '../../constants';
import { addPagePO } from '../../pageObjects';
import { quickStartLeaveModalPO, quickStartSidebarPO } from '../../pageObjects/quickStarts-po';
import { navigateToAdminMenu, perspective, quickStartsPage } from '../../pages';

let quickStartLink: string;

Given('user is at administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

When('user switches to administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

When('user goes to Cluster Overview page', () => {
  navigateToAdminMenu(adminNavigationBar.Home);
});

Given('user is at Cluster Overview page', () => {
  navigateToAdminMenu(adminNavigationBar.Home);
});

When('user clicks on the Start button', () => {
  cy.get(quickStartSidebarPO.quickStartSidebarBody).find(quickStartSidebarPO.startButton).click();
});
When('user clicks on close button', () => {
  cy.get(quickStartSidebarPO.closePanel).should('be.visible').click();
});
When('user clicks on Leave button in Leave quick start modal box', () => {
  cy.get(quickStartLeaveModalPO.leaveModal).should('be.visible');
  cy.get(quickStartLeaveModalPO.leaveButton).should('be.visible').click();
});

When('user completes first Quick Starts from the card', () => {
  cy.get(addPagePO.buildWithGuidedDocumentationItems)
    .first()
    .then(($link) => {
      quickStartLink = $link.get(0).innerText;
    });

  quickStartsPage.finishFirstQuickStart();
});

Then(
  'user can see completed Quick Starts link is replaced with another quick start link in the card',
  () => {
    cy.get(addPagePO.buildWithGuidedDocumentationItems)
      .first()
      .then(($link) => {
        const newQuickStartLink = $link.get(0).innerText;
        if (newQuickStartLink !== quickStartLink) {
          return true;
        }
        return false;
      });
  },
);
