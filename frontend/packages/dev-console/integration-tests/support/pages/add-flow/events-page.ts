import { catalogPO, eventsPO, topologyPO } from '../../pageObjects';

export const eventsPage = {
  search: (type: string) => cy.get(eventsPO.search).type(type),
  clickEventType: (eventName: string) => {
    cy.byTestID(`Events-${eventName}`).should('be.visible').click();
  },
  clickSubscribeOnSidePane: () => {
    cy.get(catalogPO.sidePane.createApplication).click({ force: true });
  },
  verifySubscribeForm: () => {
    cy.get(eventsPO.pageTitle).should('have.text', 'Subscribe');
  },
  enterTriggerName: (name: string) => {
    cy.get(eventsPO.nameField).clear();
    cy.get(eventsPO.nameField).type(name).should('have.value', name);
  },
  selectSubscriber: (subscriberName: string) => {
    cy.get(eventsPO.subscriberDropDown).click();
    cy.get(topologyPO.graph.subscriber.filterItemLink).contains(subscriberName).click();
  },
  addAttribute: (name: string, value: string) => {
    cy.get(eventsPO.addMore).click();
    // Find the input field that doesnot have any value
    cy.get(eventsPO.attributeName).each(($el) => {
      if ($el.val() === '') {
        cy.wrap($el).type(name);
      }
    });

    cy.get(eventsPO.attributeValue).each(($el) => {
      if ($el.val() === '') {
        cy.wrap($el).type(value);
      }
    });
  },
  clickSubscribeButton: () => {
    cy.get(eventsPO.subscribeButton).click();
  },
};
