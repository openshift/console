import * as _ from 'lodash';
import { checkErrors, testName } from '../../../../support';
import { alertmanager, getGlobalsAndReceiverConfig } from '../../../../views/alertmanager';
import { listPage } from '../../../../views/list-page';
import * as yamlEditor from '../../../../views/yaml-editor';

const receiverName = `PagerDutyReceiver-${testName}`;
const receiverType = 'pagerduty';
const configName = `${receiverType}_configs`;
const severity = 'severity';
const label = `${severity} = warning`;
const pagerDutyClient = '{{ template "pagerduty.default.client" . }}';
const pagerDutyClientURL = '{{ template "pagerduty.default.clientURL" . }}';
const pagerDutyURL1 = 'http://pagerduty-url-specific-to-receiver';
const pagerDutyURL2 = 'http://global-pagerduty-url';
const pagerDutyURL3 = 'http://pagerduty-url-specific-to-receiver';
const clientURL = 'http://updated-client-url';
const pagerDutyDescription = 'new description';

describe('Alertmanager: PagerDuty Receiver Form', () => {
  before(() => {
    cy.login();
    cy.initAdmin();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    alertmanager.reset();
  });

  it('creates and edits PagerDuty Receiver correctly', () => {
    cy.log('create PagerDuty Receiver');
    alertmanager.createReceiver(receiverName, configName);
    cy.byLegacyTestID('integration-key').type('<integration_key>');
    cy.byLegacyTestID('pagerduty-url')
      .invoke('val')
      .should('eq', 'https://events.pagerduty.com/v2/enqueue');
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').should('be.checked');
    cy.byLegacyTestID('pagerduty-client').invoke('val').should('eq', pagerDutyClient);
    cy.byLegacyTestID('pagerduty-client-url').invoke('val').should('eq', pagerDutyClientURL);
    cy.byLegacyTestID('pagerduty-description')
      .invoke('val')
      .should('eq', '{{ template "pagerduty.default.description" .}}');
    cy.byLegacyTestID('pagerduty-severity').invoke('val').should('eq', 'error');
    cy.byLegacyTestID('label-0').type(label);
    alertmanager.save();

    cy.log('verify PagerDuty Receiver was created correctly');
    alertmanager.validateCreation(receiverName, receiverType, label);

    cy.log('update pagerduty_url');
    listPage.rows.clickKebabAction(receiverName, 'Edit Receiver');
    // Save as default checkbox disabled when url equals global url
    cy.byLegacyTestID('save-as-default').should('be.disabled');
    // changing url enables Save as default checkbox, should save pagerduty_url with Receiver
    cy.byLegacyTestID('pagerduty-url').clear();
    cy.byLegacyTestID('pagerduty-url').type(pagerDutyURL1);
    cy.byLegacyTestID('save-as-default').should('be.enabled');
    alertmanager.save();

    cy.log('verify pagerduty_url was saved with Receiver and not global');
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(_.has(configs.globals, 'pagerduty_url')).toBeFalsy();
      expect(configs.receiverConfig.url).toBe(pagerDutyURL1);
    });

    cy.log('save pagerduty_url as global');
    alertmanager.visitEditPage(receiverName);
    cy.byLegacyTestID('pagerduty-url').clear();
    cy.byLegacyTestID('pagerduty-url').type(pagerDutyURL2);
    cy.byLegacyTestID('save-as-default').should('be.enabled').check();
    alertmanager.save();

    cy.log('verify pagerduty_url was saved as global');
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(configs.globals.pagerduty_url).toBe(pagerDutyURL2);
      expect(_.has(configs.receiverConfig, 'url')).toBeFalsy();
    });

    cy.log('add pagerduty_url to receiver with existing global');
    alertmanager.visitEditPage(receiverName);
    cy.byLegacyTestID('pagerduty-url').clear();
    cy.byLegacyTestID('pagerduty-url').type(pagerDutyURL3);
    cy.byLegacyTestID('save-as-default').should('be.enabled');
    cy.byLegacyTestID('save-as-default').should('not.be.checked');
    alertmanager.save();

    cy.log(
      'verify pagerduty_url should be saved with Receiver, as well as having a global pagerduty_url prop',
    );
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(configs.globals.pagerduty_url).toBe(pagerDutyURL2);
      expect(configs.receiverConfig.url).toBe(pagerDutyURL3);
    });

    cy.log('update advanced configuration fields correctly');
    alertmanager.visitEditPage(receiverName);
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').should('be.checked').click();
    cy.byLegacyTestID('send-resolved-alerts').should('not.be.checked');
    cy.byLegacyTestID('pagerduty-client').clear();
    cy.byLegacyTestID('pagerduty-client').type('updated-client');
    cy.byLegacyTestID('pagerduty-client-url').clear();
    cy.byLegacyTestID('pagerduty-client-url').type(clientURL);
    alertmanager.save();

    cy.log('verify 3 changed fields should be saved with Receiver');
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(configs.receiverConfig.send_resolved).toBeFalsy();
      expect(configs.receiverConfig.client).toBe('updated-client');
      expect(configs.receiverConfig.client_url).toBe('http://updated-client-url');
      expect(configs.receiverConfig.description).toBe(undefined);
      expect(configs.receiverConfig.severity).toBe(undefined);
    });

    cy.log(
      'restore default values for the 3, change desc and severity - which should then be saved with Receiver while initial 3 are removed from Receiver config',
    );
    alertmanager.visitEditPage(receiverName);
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').should('not.be.checked').click();
    cy.byLegacyTestID('send-resolved-alerts').should('be.checked');
    cy.byLegacyTestID('pagerduty-client').clear();
    cy.byLegacyTestID('pagerduty-client').type(pagerDutyClient, {
      parseSpecialCharSequences: false,
    });
    cy.byLegacyTestID('pagerduty-client-url').clear();
    cy.byLegacyTestID('pagerduty-client-url').type(pagerDutyClientURL, {
      parseSpecialCharSequences: false,
    });
    cy.byLegacyTestID('pagerduty-description').clear();
    cy.byLegacyTestID('pagerduty-description').type(pagerDutyDescription);
    cy.byLegacyTestID('pagerduty-severity').clear();
    cy.byLegacyTestID('pagerduty-severity').type(severity);
    alertmanager.save();

    cy.log('verify');
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(configs.receiverConfig.send_resolved).toBe(undefined);
      expect(configs.receiverConfig.client).toBe(undefined);
      expect(configs.receiverConfig.client_url).toBe(undefined);
      expect(configs.receiverConfig.description).toBe(pagerDutyDescription);
      expect(configs.receiverConfig.severity).toBe(severity);
    });
  });
});
