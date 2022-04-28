import { eventSourceCards } from '../../constants';
import { catalogPO, eventSinkPO } from '../../pageObjects';

export const eventSinkPage = {
  search: (type: string) => cy.get(eventSinkPO.search).type(type),
  verifyEventSinkType: (eventSinkName: string) => {
    cy.byTestID(`EventSink-${eventSinkName}`).should('be.visible');
  },
  clickEventSourceType: (eventSinkName: string | eventSourceCards) => {
    cy.byTestID(`EventSink-${eventSinkName}`)
      .should('be.visible')
      .click();
  },
  clickCreateEventSinkOnSidePane: () => {
    cy.get(catalogPO.sidePane.createApplication).click({ force: true });
  },
};
export const createEventSinkPage = {
  selectOutputTargetName: (outputTargetName: string) => {
    cy.get('#form-ns-dropdown-formData-source-key-field')
      .scrollIntoView()
      .should('be.visible')
      .click();
    cy.get("[role='listbox']")
      .find('li')
      .contains(outputTargetName)
      .should('be.visible')
      .click();
  },
};
