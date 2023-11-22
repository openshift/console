import * as _ from 'lodash';
import { checkErrors, testName } from '../../../../support';
import { alertmanager, getGlobalsAndReceiverConfig } from '../../../../views/alertmanager';
import * as yamlEditor from '../../../../views/yaml-editor';

const receiverName = `SlackReceiver-${testName}`;
const receiverType = 'slack';
const configName = `${receiverType}_configs`;
const label = 'severity = warning';
const slackAPIURL = 'http://myslackapi';
const slackChannel = 'myslackchannel';
const slackIconURL = 'http://slackiconurl';
const slackUsername = 'slackusername';

describe('Alertmanager: Slack Receiver Form', () => {
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

  it('creates and edits Slack Receiver correctly', () => {
    cy.log('create Slack Receiver');
    alertmanager.createReceiver(receiverName, configName);
    cy.byLegacyTestID('save-as-default').should('be.disabled');
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').should('not.be.checked');
    cy.byLegacyTestID('slack-icon-url')
      .invoke('val')
      .should('eq', '{{ template "slack.default.iconurl" .}}');
    cy.byLegacyTestID('slack-icon-emoji').should('not.exist');
    cy.byLegacyTestID('slack-icon-type-emoji').click();
    cy.byLegacyTestID('slack-icon-url').should('not.exist');
    cy.byLegacyTestID('slack-icon-emoji')
      .invoke('val')
      .should('eq', '{{ template "slack.default.iconemoji" .}}');
    cy.byLegacyTestID('slack-username')
      .invoke('val')
      .should('eq', '{{ template "slack.default.username" . }}');
    cy.byLegacyTestID('slack-link-names').should('not.be.checked');
    cy.byLegacyTestID('slack-api-url').type(slackAPIURL);
    cy.byLegacyTestID('save-as-default').should('be.enabled');
    cy.byLegacyTestID('slack-channel').type(slackChannel);
    cy.byLegacyTestID('label-0').type(label);
    alertmanager.save();

    cy.log('verify Slack Receiver was created correctly');
    alertmanager.validateCreation(receiverName, receiverType, label);
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(_.has(configs.globals, 'slack_api_url')).toBeFalsy();
      expect(configs.receiverConfig.channel).toBe(slackChannel);
      expect(configs.receiverConfig.api_url).toBe(slackAPIURL);
      // make sure adv fields are not saved since they equal their global values
      expect(_.has(configs.receiverConfig, 'send_resolved')).toBeFalsy();
      expect(_.has(configs.receiverConfig, 'username')).toBeFalsy();
    });

    cy.log('save globals and advanced fields correctly');
    alertmanager.visitEditPage(receiverName);
    cy.byLegacyTestID('slack-channel').invoke('val').should('eq', slackChannel);
    cy.byLegacyTestID('save-as-default').should('be.enabled');
    cy.byLegacyTestID('slack-api-url').invoke('val').should('eq', slackAPIURL);
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').click();
    cy.byLegacyTestID('slack-icon-url').clear();
    cy.byLegacyTestID('slack-icon-url').type(slackIconURL);
    cy.byLegacyTestID('slack-username').clear();
    cy.byLegacyTestID('slack-username').type(slackUsername);
    cy.byLegacyTestID('slack-link-names').click();
    cy.byLegacyTestID('save-as-default').click();
    alertmanager.save();

    cy.log('verify advanced fields were saved correctly');
    alertmanager.visitEditPage(receiverName);
    alertmanager.showAdvancedConfiguration();
    cy.byLegacyTestID('send-resolved-alerts').should('be.checked');
    cy.byLegacyTestID('slack-icon-url').invoke('val').should('eq', slackIconURL);
    cy.byLegacyTestID('slack-icon-emoji').should('not.exist');
    cy.byLegacyTestID('slack-username').invoke('val').should('eq', slackUsername);
    cy.byLegacyTestID('slack-link-names').should('be.checked');
    alertmanager.visitAlertmanagerPage();
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(configs.globals.slack_api_url).toBe(slackAPIURL);
      expect(_.has(configs.receiverConfig, 'api_url')).toBeFalsy();
      expect(configs.receiverConfig.channel).toBe('myslackchannel');
      expect(configs.receiverConfig.send_resolved).toBeTruthy();
      expect(configs.receiverConfig.icon_url).toBe(slackIconURL);
      expect(configs.receiverConfig.username).toBe(slackUsername);
      expect(configs.receiverConfig.link_names).toBeTruthy();
    });
  });
});
