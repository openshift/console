import { And, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { addOptions } from '@console/dev-console/integration-tests/support/constants';
import { addPage, topologyPage } from '@console/dev-console/integration-tests/support/pages';
import { eventingPO } from '../../pageObjects';

And('user selects Event Sink card', () => {
  addPage.selectCardFromOptions(addOptions.EventSink);
});

And('user selects sinks provided by Red Hat', () => {
  cy.get(eventingPO.catalogProviderRedHat).click();
});

And('user switches to form view', () => {
  cy.byTestID('form-view-input')
    .should('be.visible')
    .click();
});

And('user creates a BootStrapServer as {string}', (serverName: string) => {
  cy.get(eventingPO.bootstrapServers)
    .should('be.visible')
    .clear()
    .type(serverName)
    .type('{enter}');
});

And('user creates a Topic as {string}', (name: string) => {
  cy.byTestID('kafkasink-topic-field')
    .should('be.visible')
    .clear()
    .type(name);
});

And('user clicks on Create button for kafkasink form', () => {
  cy.get(eventingPO.submit)
    .should('be.enabled')
    .click();
});

And('user is at Topology Graph view', () => {
  topologyPage.verifyTopologyGraphView();
});

And('user has created KafkaSink {string} in topology', (name: string) => {
  topologyPage.verifyWorkloadInTopologyPage(name);
});

When(
  'user selects {string} context menu option of kafka sink {string}',
  (option: string, kafkaSinkName: string) => {
    topologyPage.rightClickOnNode(kafkaSinkName);
    topologyPage.selectContextMenuAction(option);
  },
);

When('user clicks Delete button on Delete modal', () => {
  modal.modalTitleShouldContain('Delete KafkaSink?');
  modal.submit();
  modal.shouldBeClosed();
});

Then('user will not see {string} in topology', (name: string) => {
  topologyPage.verifyWorkloadNotInTopologyPage(name, { timeout: 15000 });
});
