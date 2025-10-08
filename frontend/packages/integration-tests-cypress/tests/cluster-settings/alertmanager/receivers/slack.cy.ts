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
    cy.byTestID('save-as-default').should('be.disabled');
    alertmanager.showAdvancedConfiguration();
    cy.byTestID('send-resolved-alerts').should('not.be.checked');
    cy.byTestID('slack-icon-url')
      .invoke('val')
      .should('eq', '{{ template "slack.default.iconurl" .}}');
    cy.byTestID('slack-icon-emoji').should('not.exist');
    cy.byTestID('Emoji-radio-input').click();
    cy.byTestID('slack-icon-url').should('not.exist');
    cy.byTestID('slack-icon-emoji')
      .invoke('val')
      .should('eq', '{{ template "slack.default.iconemoji" .}}');
    cy.byTestID('slack-username')
      .invoke('val')
      .should('eq', '{{ template "slack.default.username" . }}');
    cy.byTestID('slack-link-names').should('not.be.checked');
    cy.byTestID('slack-api-url').type(slackAPIURL);
    cy.byTestID('save-as-default').should('be.enabled');
    cy.byTestID('slack-channel').type(slackChannel);
    cy.byTestID('label-0').type(label);
    alertmanager.save();

    cy.log('verify Slack Receiver was created correctly');
    alertmanager.validateCreation(receiverName);
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
    cy.byTestID('slack-channel').invoke('val').should('eq', slackChannel);
    cy.byTestID('save-as-default').should('be.enabled');
    cy.byTestID('slack-api-url').invoke('val').should('eq', slackAPIURL);
    alertmanager.showAdvancedConfiguration();
    cy.byTestID('send-resolved-alerts').click();
    cy.byTestID('slack-icon-url').clear();
    cy.byTestID('slack-icon-url').type(slackIconURL);
    cy.byTestID('slack-username').clear();
    cy.byTestID('slack-username').type(slackUsername);
    cy.byTestID('slack-link-names').click();
    cy.byTestID('save-as-default').click();
    alertmanager.save();

    cy.log('verify advanced fields were saved correctly');
    alertmanager.visitEditPage(receiverName);
    alertmanager.showAdvancedConfiguration();
    cy.byTestID('send-resolved-alerts').should('be.checked');
    cy.byTestID('slack-icon-url').invoke('val').should('eq', slackIconURL);
    cy.byTestID('slack-icon-emoji').should('not.exist');
    cy.byTestID('slack-username').invoke('val').should('eq', slackUsername);
    cy.byTestID('slack-link-names').should('be.checked');
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
