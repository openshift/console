import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { operatorsPage } from '@console/dev-console/integration-tests/support/pages';
import {
  eventingPO,
  servingPO,
} from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';
import {
  eventingSources,
  eventingChannel,
  eventingSourcesFilterandVerify,
  eventingChannelFilterandVerify,
} from '@console/knative-plugin/integration-tests/support/pages/admin-perspective/eventing-page';

Given('user has selected Services tab', () => {
  cy.get(servingPO.servicesTab).click();
});

When('user clicks on dropdown button', () => {
  cy.get(eventingPO.filter.Toolbar).within(() => {
    cy.get(eventingPO.filter.TypeMenu).click();
  });
});

When('user selects Name', () => {
  cy.get(eventingPO.filter.Toolbar).within(() => {
    cy.get(eventingPO.filter.Type).contains('Name').click();
  });
});

When('user enters {string}', (filterName: string) => {
  cy.get(eventingPO.filter.Input).type(filterName);
});

Then('user will see KSVC by name {string}', (serviceName: string) => {
  cy.get(eventingPO.resourceIcon).should('contain.text', 'KSVC');
  cy.get(`[data-test-id=${serviceName}]`).should('be.visible');
});

Then('user will see Clear all filters', () => {
  cy.get(eventingPO.filter.Toolbar).contains('Clear all filters').should('exist');
});

Given('user has selected Routes tab', () => {
  cy.get(servingPO.routesTab).click();
});

When('user selects Label', () => {
  cy.get(eventingPO.filter.Toolbar).within(() => {
    cy.get(eventingPO.filter.Type).contains('Label').click();
  });
});

Then('user will see routes for KSVC by name {string}', (serviceName: string) => {
  cy.get(eventingPO.resourceIcon).should('contain.text', 'RT');
  cy.get(`[data-test-id=${serviceName}]`).should('be.visible');
});

Given('user has selected Revisions tab', () => {
  cy.get(servingPO.revisionsTab).click();
});

Then('user will see message {string}', (revisionMessage) => {
  cy.get(eventingPO.message).should('contain.text', revisionMessage);
});

When('user enters {string} in Label filter', (filterName: string) => {
  cy.get(eventingPO.filter.labelInput).type(filterName);
  cy.get(eventingPO.filter.labelSuggestion).eq(0).click();
});

Given('user has created ApiServer Source', () => {
  eventingSources.createApiServerSource();
});

Given('user has created Ping Source', () => {
  eventingSources.createPingSource();
});

Given('user has created Sink Binding', () => {
  eventingSources.createSinkBinding();
});

Given('user has created Container Source', () => {
  eventingSources.createContainerSource();
});

Given('user is at Event Sources tab', () => {
  operatorsPage.navigateToEventingPage();
  cy.get(eventingPO.createEventDropDownMenu).contains('Create').click({ force: true });
  cy.get(eventingPO.eventSourcesTab).click();
});

When('user clicks on Filter dropdown', () => {
  cy.get(eventingPO.filter.ToggleButton).click();
});

When(
  'user will see digit {string} in front of ApiServer, Ping, Container Sources and digit {string} in front of SinkBinding',
  (number1: string, number2: string) => {
    cy.get(eventingPO.filter.apiserversource).within(() => {
      cy.get(eventingPO.filter.item).should('contain.text', 'ApiServerSource');
      cy.get(eventingPO.filter.count).should('contain.text', number1);
    });
    cy.get(eventingPO.filter.containersource).within(() => {
      cy.get(eventingPO.filter.item).should('contain.text', 'ContainerSource');
      cy.get(eventingPO.filter.count).should('contain.text', number1);
    });
    cy.get(eventingPO.filter.pingsource).within(() => {
      cy.get(eventingPO.filter.item).should('contain.text', 'PingSource');
      cy.get(eventingPO.filter.count).should('contain.text', number1);
    });
    cy.get(eventingPO.filter.sinkbinding).within(() => {
      cy.get(eventingPO.filter.item).should('contain.text', 'SinkBinding');
      cy.get(eventingPO.filter.count).should('contain.text', number2);
    });
    cy.get(eventingPO.filter.ToggleButton).click();
  },
);

Then('user will see ApiServer source type as ApiSource is selected in filter dropdown', () => {
  eventingSourcesFilterandVerify.apiServerSource();
});

Then(
  'user will see Container source type as ContainerSource is selected in filter dropdown',
  () => {
    eventingSourcesFilterandVerify.containerSource();
  },
);

Then('user will see Ping source type as PingSource is selected in filter dropdown', () => {
  eventingSourcesFilterandVerify.pingSource();
});

Then('user will see Sink source type as SinkBinding is selected in filter dropdown', () => {
  eventingSourcesFilterandVerify.sinkBinding();
});

Given('user has created Default Channel', () => {
  eventingChannel.createDefaultChannel();
});

Given('user has created In Memory Channel', () => {
  eventingChannel.createInMemoryChannel();
});

Given('user is at Channels tab', () => {
  operatorsPage.navigateToEventingPage();
  cy.get(eventingPO.channel.tab).click();
});

Then(
  'user will see digit {string} in front of Channel and digit {string} in front of InMemoryChannel',
  (number1: string, number2: string) => {
    cy.get(servingPO.filter.channel).within(() => {
      cy.get(servingPO.filter.item).should('contain.text', 'Channel');
      cy.get(servingPO.filter.count).should('contain.text', number1);
    });
    cy.get(servingPO.filter.inmemorychannel).within(() => {
      cy.get(servingPO.filter.item).should('contain.text', 'InMemoryChannel');
      cy.get(servingPO.filter.count).should('contain.text', number2);
    });
    cy.get(servingPO.filter.ToggleButton).click();
  },
);

Then('user will see Channel type as Channel is selected in filter dropdown', () => {
  eventingChannelFilterandVerify.defaultChannel();
});

Then(
  'user will see In Memory Channel type as InMemoryChannel is selected in filter dropdown',
  () => {
    eventingChannelFilterandVerify.inMemoryChannel();
  },
);
