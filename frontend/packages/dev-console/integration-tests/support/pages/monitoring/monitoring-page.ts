import { monitoringTabs } from '../../constants';
import { monitoringPO } from '../../pageObjects';

export const detailsPage = {
  isTabSelected: (tabSelector: string) =>
    cy.get(tabSelector).parent('li').should('have.class', 'active'),
  selectTab: (tabSelector: string) => cy.get(tabSelector).click(),
};

export const monitoringPage = {
  events: {
    selectResources: (resourceName: string) => {
      cy.selectValueFromAutoCompleteDropDown(monitoringPO.eventsTab.resources, resourceName);
    },
    selectType: () => {
      cy.byTestID('console-select-menu-toggle').click();
      cy.get('#all-link').click();
      // To Do
    },
  },
  selectTab: (tabName: monitoringTabs | string) => {
    switch (tabName) {
      case 'Events':
      case monitoringTabs.Events:
        detailsPage.selectTab(monitoringPO.tabs.events);
        cy.url().should('include', 'events');
        break;
      default:
        cy.log(`${tabName} is unable to click on monitoring page`);
        break;
    }
  },
};
