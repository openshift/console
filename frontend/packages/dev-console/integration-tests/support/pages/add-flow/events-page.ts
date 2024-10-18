import { eventingPO } from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';
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
    cy.get(eventingPO.events.pageTitle).should('have.text', 'Subscribe');
  },
  enterTriggerName: (name: string) => {
    cy.get(eventingPO.events.nameField).clear();
    cy.get(eventingPO.events.nameField).type(name).should('have.value', name);
  },
  selectSubscriber: (subscriberName: string) => {
    cy.get(eventingPO.events.subscriberDropDown).click();
    cy.get(topologyPO.graph.subscriber.filterItemLink).contains(subscriberName).click();
  },
  addAttribute: (name: string, value: string) => {
    cy.get(eventingPO.events.addMore).click();
    // Find the input field that doesnot have any value
    cy.get(eventingPO.events.attributeName).each(($el) => {
      if ($el.val() === '') {
        cy.wrap($el).type(name);
      }
    });

    cy.get(eventingPO.events.attributeValue).each(($el) => {
      if ($el.val() === '') {
        cy.wrap($el).type(value);
      }
    });
  },
  clickSubscribeButton: () => {
    cy.get(eventingPO.events.subscribeButton).click();
  },
};
