import { operatorsPage } from '@console/dev-console/integration-tests/support/pages';
import { eventingPO } from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';

export const eventingSources = {
  createPingSource: () => {
    operatorsPage.navigateToEventingPage();
    cy.get(eventingPO.createEventDropDownMenu)
      .contains('Create')
      .click({ force: true });
    cy.get(eventingPO.createEventSource).click();
    cy.get(eventingPO.pingSource.create).click();
    cy.get(eventingPO.catalogSidebarCreateButton)
      .contains('Create Event Source')
      .click({ force: true });
    cy.get(eventingPO.pingSource.dataField).type('Message');
    cy.get(eventingPO.pingSource.scheduleField).type('* * * * *');
    cy.get(eventingPO.pingSource.resource).click();
    cy.get(eventingPO.pingSource.resourceItem)
      .eq(0)
      .click({ force: true });
    cy.get(eventingPO.pingSource.submit).click();
    cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
  },
  createApiServerSource: () => {
    operatorsPage.navigateToEventingPage();
    cy.get(eventingPO.createEventDropDownMenu)
      .contains('Create')
      .click({ force: true });
    cy.get(eventingPO.createEventSource).click();
    cy.get(eventingPO.apiServerSource.create).click();
    cy.get(eventingPO.catalogSidebarCreateButton)
      .contains('Create Event Source')
      .click({ force: true });
    cy.get(eventingPO.apiServerSource.apiVersionField).type('apiVersion');
    cy.get(eventingPO.apiServerSource.kindField).type('kind');
    cy.get(eventingPO.apiServerSource.resource).click();
    cy.get(eventingPO.apiServerSource.resourceItem)
      .eq(0)
      .click({ force: true });
    cy.get(eventingPO.apiServerSource.submit).click();
    cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
  },
  createSinkBinding: () => {
    operatorsPage.navigateToEventingPage();
    cy.get(eventingPO.createEventDropDownMenu)
      .contains('Create')
      .click({ force: true });
    cy.get(eventingPO.createEventSource).click();
    cy.get(eventingPO.sinkBinding.create).click();
    cy.get(eventingPO.catalogSidebarCreateButton)
      .contains('Create Event Source')
      .click({ force: true });
    cy.get(eventingPO.sinkBinding.apiVersionField).type('apiVersion');
    cy.get(eventingPO.sinkBinding.kindField).type('kind');
    cy.get(eventingPO.sinkBinding.resource).click();
    cy.get(eventingPO.sinkBinding.resourceItem)
      .contains('openshift')
      .click({ force: true });
    cy.get(eventingPO.sinkBinding.submit).click();
    cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
  },
  createContainerSource: () => {
    operatorsPage.navigateToEventingPage();
    cy.get(eventingPO.createEventDropDownMenu)
      .contains('Create')
      .click({ force: true });
    cy.get(eventingPO.createEventSource).click();
    cy.get(eventingPO.containerSource.create).click();
    cy.get(eventingPO.catalogSidebarCreateButton)
      .contains('Create Event Source')
      .click({ force: true });
    cy.get(eventingPO.containerSource.imageField).type('hello-openshift');
    cy.get(eventingPO.containerSource.resource).click();
    cy.get(eventingPO.containerSource.resourceItem)
      .contains('openshift')
      .click({ force: true });
    cy.get(eventingPO.containerSource.submit).click();
    cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
  },
};

export const eventingChannel = {
  createDefaultChannel: () => {
    operatorsPage.navigateToEventingPage();
    cy.get(eventingPO.createEventDropDownMenu)
      .contains('Create')
      .click({ force: true });
    cy.get(eventingPO.channel.createChannel).click();
    cy.get(eventingPO.channel.typeField).click();
    cy.get(eventingPO.channel.createDropDownDefaultChannel).click();
    cy.get(eventingPO.channel.submit).click();
    cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
  },
  createInMemoryChannel: () => {
    operatorsPage.navigateToEventingPage();
    cy.get(eventingPO.createEventDropDownMenu)
      .contains('Create')
      .click({ force: true });
    cy.get(eventingPO.channel.createChannel).click();
    cy.get(eventingPO.channel.typeField).click();
    cy.get(eventingPO.channel.createDropDownInMemoryChannel).click();
    cy.get(eventingPO.channel.submit).click();
    cy.get(eventingPO.pageDetails).should('include.text', 'Project details');
  },
};

export const eventingSourcesFilterandVerify = {
  pingSource: () => {
    cy.get(eventingPO.filter.ToggleButton).click();
    cy.get(eventingPO.filter.pingsource).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.resourceType).should('contain.text', 'PingSource');
    cy.get(eventingPO.filter.pingsource).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.filter.ToggleButton).click();
  },
  containerSource: () => {
    cy.get(eventingPO.filter.ToggleButton).click();
    cy.get(eventingPO.filter.containersource).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.resourceType).should('contain.text', 'ContainerSource');
    cy.get(eventingPO.filter.containersource).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.filter.ToggleButton).click();
  },
  apiServerSource: () => {
    cy.get(eventingPO.filter.ToggleButton).click();
    cy.get(eventingPO.filter.apiserversource).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.resourceType).should('contain.text', 'ApiServerSource');
    cy.get(eventingPO.filter.apiserversource).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.filter.ToggleButton).click();
  },
  sinkBinding: () => {
    cy.get(eventingPO.filter.ToggleButton).click();
    cy.get(eventingPO.filter.sinkbinding).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.resourceType).should('contain.text', 'SinkBinding');
    cy.get(eventingPO.filter.containersource).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.filter.ToggleButton).click();
  },
};

export const eventingChannelFilterandVerify = {
  defaultChannel: () => {
    cy.get(eventingPO.filter.ToggleButton).click();
    cy.get(eventingPO.channel.channelfilter).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.resourceType).should('contain.text', 'Channel');
    cy.get(eventingPO.channel.channelfilter).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.filter.ToggleButton).click();
  },
  inMemoryChannel: () => {
    cy.get(eventingPO.filter.ToggleButton).click();
    cy.get(eventingPO.channel.inmemorychannelfilter).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.resourceType).should('contain.text', 'InMemoryChannel');
    cy.get(eventingPO.channel.inmemorychannelfilter).within(() => {
      cy.get(eventingPO.filter.checkbox).click();
    });
    cy.get(eventingPO.filter.ToggleButton).click();
  },
};
