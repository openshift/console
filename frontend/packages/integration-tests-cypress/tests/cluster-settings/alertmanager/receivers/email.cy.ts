import * as _ from 'lodash';
import { checkErrors, testName } from '../../../../support';
import { alertmanager, getGlobalsAndReceiverConfig } from '../../../../views/alertmanager';
import * as yamlEditor from '../../../../views/yaml-editor';

const receiverName = `EmailReceiver-${testName}`;
const receiverType = 'email';
const configName = `${receiverType}_configs`;
const localhost = 'localhost';
const label = 'severity = warning';
const emailTo = 'you@there.com';
const emailFrom = 'me@here.com';
const emailSmarthost = 'smarthost:8080';
const username = 'username';
const password = 'password';
const identity = 'identity';
const secret = 'secret';
const html = 'myhtml';

describe('Alertmanager: Email Receiver Form', () => {
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

  it('creates and edits Email Receiver correctly', () => {
    cy.log('create Email Receiver');
    alertmanager.createReceiver(receiverName, configName);
    // prior to smtp change, save as default is disabled
    cy.byTestID('save-as-default').should('be.disabled');
    cy.byTestID('email-hello').invoke('val').should('eq', localhost);
    cy.byTestID('email-require-tls').should('be.checked');
    alertmanager.showAdvancedConfiguration();
    cy.byTestID('send-resolved-alerts').should('not.be.checked');
    cy.byTestID('email-html').invoke('val').should('eq', '{{ template "email.default.html" . }}');
    cy.byTestID('email-to').type(emailTo);
    cy.byTestID('email-from').type(emailFrom);
    cy.byTestID('save-as-default').should('be.enabled');
    cy.byTestID('email-smarthost').type(emailSmarthost);
    cy.byTestID('label-0').type(label);
    alertmanager.save();

    cy.log('verify Email Receiver was created correctly');
    alertmanager.validateCreation(receiverName);
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(_.has(configs.globals, 'email_to')).toBeFalsy();
      expect(_.has(configs.globals, 'smtp_from')).toBeFalsy();
      expect(_.has(configs.globals, 'smtp_smarthost')).toBeFalsy();
      expect(_.has(configs.globals, 'smtp_require_tls')).toBeFalsy();
      expect(configs.receiverConfig.to).toBe(emailTo);
      expect(configs.receiverConfig.from).toBe(emailFrom);
      expect(configs.receiverConfig.smarthost).toBe(emailSmarthost);
      expect(_.has(configs.receiverConfig, 'require_tls')).toBeFalsy(); // unchanged from global value
    });

    cy.log('save globals and advanced fields correctly');
    alertmanager.visitEditPage(receiverName);
    cy.byTestID('email-to').invoke('val').should('eq', emailTo);
    cy.byTestID('save-as-default').should('be.enabled'); // smtp_from different from global
    cy.byTestID('save-as-default').should('not.be.checked');
    cy.byTestID('email-from').invoke('val').should('eq', emailFrom);
    cy.byTestID('email-hello').invoke('val').should('eq', localhost);
    cy.byTestID('email-auth-username').type(username);
    cy.byTestID('email-auth-password').type(password);
    cy.byTestID('email-auth-identity').type(identity);
    cy.byTestID('email-auth-secret').type(secret);
    cy.byTestID('email-require-tls').click();
    alertmanager.showAdvancedConfiguration();
    cy.byTestID('send-resolved-alerts').click();
    cy.byTestID('email-html').clear();
    cy.byTestID('email-html').type(html);
    alertmanager.save();

    cy.log('verify globals and advanced fields were saved correctly');
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(_.has(configs.globals, 'smtp_auth_username')).toBeFalsy();
      expect(configs.receiverConfig.auth_username).toBe(username);
      expect(configs.receiverConfig.auth_password).toBe(password);
      expect(configs.receiverConfig.auth_identity).toBe(identity);
      expect(configs.receiverConfig.auth_secret).toBe(secret);
      expect(configs.receiverConfig.require_tls).toBeFalsy();
      expect(configs.receiverConfig.send_resolved).toBeTruthy();
      expect(configs.receiverConfig.html).toBe(html);
    });

    cy.log('save as default');
    alertmanager.visitEditPage(receiverName);
    cy.byTestID('save-as-default').should('not.be.checked');
    cy.byTestID('save-as-default').click();
    alertmanager.save();
    alertmanager.visitYAMLPage();
    yamlEditor.getEditorContent().then((content) => {
      const configs = getGlobalsAndReceiverConfig(receiverName, configName, content);
      expect(configs.globals.smtp_from).toBe(emailFrom);
      expect(configs.globals.smtp_hello).toBe(localhost);
      expect(configs.globals.smtp_smarthost).toBe(emailSmarthost);
      expect(configs.globals.smtp_auth_username).toBe(username);
      expect(configs.globals.smtp_auth_password).toBe(password);
      expect(configs.globals.smtp_auth_identity).toBe(identity);
      expect(configs.globals.smtp_auth_secret).toBe(secret);
      expect(configs.globals.smtp_require_tls).toBeFalsy();
      // non-global fields should still be saved with Receiver
      expect(configs.receiverConfig.to).toBe(emailTo);
    });
  });
});
