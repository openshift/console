import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  addOptions,
  devNavigationMenu,
  resourceTypes,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants';
import { eventSourcePO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  addPage,
  createGitWorkloadIfNotExistsOnTopologyPage,
  topologyHelper,
  topologyPage,
} from '@console/dev-console/integration-tests/support/pages';
import {
  app,
  navigateTo,
  perspective,
} from '@console/dev-console/integration-tests/support/pages/app';
import { eventingPO } from '../../pageObjects';

When('user navigates to Add page}', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user clicks on the Channel card', () => {
  addPage.selectCardFromOptions(addOptions.Channel);
});

Then('user clicks on YAML view', () => {
  cy.get(eventingPO.channel.yamlView).should('be.visible').click();
});

Then('user can see reate button enabled', () => {
  modal.submitShouldBeEnabled();
});

When('user selects auto selected InMemoryChannel from Type dropdown', () => {
  cy.get(eventingPO.channel.selectChannel).click();
  cy.get(eventingPO.channel.channelDropdown).contains('InMemoryChannel').click();
});

When('user selects Application', () => {
  cy.get(eventingPO.formView).click();
  cy.get(eventingPO.channel.applicationInput).type('channel-application');
});

When('user enters the name of the Channel {string}', (channelName: string) => {
  cy.get(eventingPO.channel.name).clear().type(channelName);
});

When('user clicks on the Create button', () => {
  cy.get(eventingPO.channel.submit).click();
});

Then('user will see the channel {string} created', (channelName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyWorkloadInTopologyPage(channelName);
});

When('user has already created the channel {string}', (channelName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyWorkloadInTopologyPage(channelName);
});

When('user clicks on the Event Source card', () => {
  cy.get(eventingPO.eventSourceCard).click();
});

When('user selects Ping Source card', () => {
  cy.get(eventingPO.pingSource.create).click();
  cy.get(eventingPO.createCatalog).contains('Create Event Source').click({ force: true });
});

When('user enters Schedule', () => {
  cy.get(eventingPO.pingSource.dataField).type('Message');
  cy.get(eventingPO.pingSource.scheduleField).type('* * * * *');
});

When('user selects the channel {string} from Resource dropdown', (channelName: string) => {
  cy.get(eventSourcePO.createPingSource.resourceToggleButton).click();
  cy.get(eventSourcePO.createPingSource.resourceDropDownField).click();
  cy.get(eventSourcePO.createPingSource.resourceFilter).type(channelName);
  cy.get(eventSourcePO.createPingSource.resourceDropDownItem).eq(0).click();
});

When('user enters name of the ping source {string}', (sourceName: string) => {
  cy.get(eventSourcePO.createPingSource.name).clear().type(sourceName);
});

Then('user will see that event source is connected to channel', () => {
  cy.get(eventingPO.channel.eventSourceNodeLink).should('exist');
});

When('user right clicks on the channel {string}', (channelName: string) => {
  topologyPage.rightClickOnNode(channelName);
});

Then('user will see the Context Menu for channel', () => {
  cy.get(eventingPO.channel.contextMenu).should('exist');
});

Then('user will see option {string}', (optionName: string) => {
  cy.get(eventingPO.channel.contextMenuItem).contains(optionName).should('be.visible');
});

When('user clicks on the {string}', (optionName: string) => {
  cy.get(eventingPO.channel.contextMenuItem).contains(optionName).click();
});

When('user will click on the Application dropdown on the modal', () => {
  cy.get(eventingPO.channel.applicationDropDown).click();
});

When('user selects the Application {string}', (applicationName: string) => {
  cy.get(eventingPO.channel.applicationItem).contains(applicationName).click();
});

When('user clicks on Save button', () => {
  cy.get(eventingPO.channel.save).click();
});

Then('user will see that Channel is without an application group', () => {
  cy.get(eventingPO.channel.nodeLabel)
    .contains('channel-test')
    .within(() => {
      cy.byTestID(`group:channel-application`, { timeout: 0 }).should('not.exist');
    });
});

Then(
  'user will see the changed Application Groupings of Channel as {string}',
  (appName: string) => {
    cy.get(eventingPO.channel.nodeLabel)
      .contains('channel-test')
      .within(() => {
        cy.byTestID(`group:${appName}`, { timeout: 0 }).should('not.exist');
      });
  },
);

When('user clicks on the Save button on the modal to save annotation and close the modal', () => {
  cy.get(eventingPO.channel.save).click('center', { force: true });
  navigateTo(devNavigationMenu.Add);
});

When('user selects the Application in the dropdown {string}', (appName: string) => {
  cy.get(eventingPO.channel.applicationDropDown).click();
  cy.get(eventingPO.channel.applicationItem).contains(appName).click();
});

When('user selects the {string} item', (applicationName: string) => {
  cy.get(eventingPO.channel.dropDownMenu).contains(applicationName).click();
});

When('user adds the label {string}', (label: string) => {
  cy.get(eventingPO.channel.labelTagsInput).click().type(label);
});

When('user clicks on the Save button on the modal to save labels and close the modal', () => {
  cy.get(eventingPO.channel.save).click('center', { force: true });
});

When('user clicks on the Channel {string} to open the sidebar', (channelName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.clickOnNode(channelName);
});

When('user opens the {string} tab', (tabName: string) => {
  cy.get(eventingPO.channel.sidebarTab).contains(tabName).click();
});

Then('user will see the newly added label {string}', (label: string) => {
  cy.get(eventingPO.channel.labelList).should('contain', label);
});

When(
  'user adds the annotation {string} and type {string}',
  (annotationName: string, type: string) => {
    cy.get(eventingPO.channel.addAnnotations).click();
    cy.get(eventingPO.channel.keyAnnotations).last().type(annotationName);
    cy.get(eventingPO.channel.valueAnnotations).last().type(type);
  },
);

Then(
  'user will see the newly added annotation {string} and type {string}',
  (annotationName: string, type: string) => {
    topologyPage.clickOnNode('ping-source');
    topologyPage.clickOnNode('channel-test');
    cy.get(eventingPO.channel.sidebarTab).contains('Details').should('exist');
    cy.get(eventingPO.channel.editAnnotations).click();
    cy.byTestID('pairs-list-name').should('have.value', annotationName);
    cy.byTestID('pairs-list-value').should('have.value', type);
    cy.get(eventingPO.channel.save).click('center', { force: true });
    cy.get(eventingPO.channel.sidebarClose).click();
  },
);

Then('user will see the YAML editor to edit the channel', () => {
  cy.get(eventingPO.channel.yamlEditor).should('exist');
});

When('user clicks on the Delete button on the modal', () => {
  cy.get(eventingPO.channel.save).click();
});

Then('user will not see channel {string}', (channelName: string) => {
  cy.reload();
  app.waitForLoad();
  topologyHelper.verifyWorkloadDeleted(channelName);
});

Then('user will see the {string} tab', (tabName: string) => {
  cy.get(eventingPO.channel.sidebarTab).contains(tabName).should('exist');
});

Then('user will see name of channel', () => {
  cy.get(eventingPO.channel.channelName).should('exist');
});

Then('user will see namespace of channel', () => {
  cy.get(eventingPO.channel.namespaceResource).should('exist');
});

Then('user will see labels and annotations associated with channel', () => {
  cy.get(eventingPO.channel.sidebarLabelList).should('exist');
  cy.get(eventingPO.channel.editAnnotations).should('exist');
});

Then('user will see the owner and channel created time', () => {
  cy.get(eventingPO.channel.ownerDetails).should('exist');
  cy.get(eventingPO.channel.timeStamp).should('exist');
});

Given(
  'user is having Channel subscribed to Knative Service {string} on the Topology page',
  (serviceName: string) => {
    perspective.switchTo(switchPerspective.Developer);
    createGitWorkloadIfNotExistsOnTopologyPage(
      'https://github.com/sclorg/nodejs-ex.git',
      serviceName,
      resourceTypes.knativeService,
      'channel-application',
    );
    topologyPage.rightClickOnNode('channel-test');
    cy.get(eventingPO.channel.contextMenu).contains('Add Subscription').click();
    cy.get(eventingPO.channel.subscriberInput).click();
    cy.get(eventingPO.channel.applicationItem).contains(serviceName).click();
    cy.get(eventingPO.channel.save).click();
  },
);

Then('user will see the Subscribers', () => {
  cy.get(eventingPO.channel.subscriberResource).should('exist');
});

Given(
  'user is having Channel subscribed to Knative Service and event source connected to it on the Topology page',
  () => {
    navigateTo(devNavigationMenu.Topology);
    cy.get(eventingPO.channel.edgeLink).should('exist');
  },
);

Then('user will see the Event Sources sinked to channel', () => {
  cy.get(eventingPO.channel.resourceItem).contains('ping-source').should('exist');
});
