import { channelPO } from '../../pageObjects/add-flow-po';

export const channelPage = {
  selectChannelType: (channelType: string = 'InMemoryChannel') => {
    cy.get(channelPO.channelType).click();
    cy.get('[data-test-dropdown-menu="messaging.knative.dev~v1~InMemoryChannel"]').click();
    cy.log(`"${channelType}" is selected`);
  },
  enterChannelName: (channelName: string) =>
    cy
      .get(channelPO.channelName)
      .clear()
      .type(channelName),
  enterAppName: (appName: string) => {
    cy.get(channelPO.appName).then(($el) => {
      if ($el.prop('tagName').includes('button')) {
        cy.get(channelPO.appName).click();
        cy.get(`li #${appName}-link`).click();
      } else if ($el.prop('tagName').includes('input')) {
        cy.get(channelPO.appName)
          .scrollIntoView()
          .invoke('val')
          .should('not.be.empty');
        cy.get(channelPO.appName)
          .clear()
          .type(appName)
          .should('have.value', appName);
      } else {
        cy.log(`App name doesn't contain button or input tags`);
      }
    });
  },
};
