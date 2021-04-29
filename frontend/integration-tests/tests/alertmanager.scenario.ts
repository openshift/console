import { browser, ExpectedConditions as until } from 'protractor';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';

import { checkLogs, checkErrors, firstElementByTestID, appHost } from '../protractor.conf';
import { fillInput } from '@console/shared/src/test-utils/utils';
import { dropdownMenuForTestID } from '../views/form.view';
import {
  AlertmanagerConfig,
  AlertmanagerReceiver,
} from '@console/internal/components/monitoring/alert-manager-config';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';
import * as monitoringView from '../views/monitoring.view';
import * as horizontalnavView from '../views/horizontal-nav.view';
import { execSync } from 'child_process';

const getGlobalsAndReceiverConfig = (configName: string, yamlStr: string) => {
  const config: AlertmanagerConfig = safeLoad(yamlStr);
  const receiverConfig: AlertmanagerReceiver = _.find(config.receivers, { name: 'MyReceiver' });
  return {
    globals: config.global,
    receiverConfig: receiverConfig[configName][0],
  };
};

describe('Alertmanager: PagerDuty Receiver Form', () => {
  afterAll(() => {
    execSync(
      `kubectl patch secret 'alertmanager-main' -n 'openshift-monitoring' --type='json' -p='[{ op: 'replace', path: '/data/alertmanager.yaml', value: ${monitoringView.defaultAlertmanagerYaml}}]'`,
    );
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('creates PagerDuty Receiver correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig`);
    await crudView.isLoaded();
    await firstElementByTestID('create-receiver').click();
    await crudView.isLoaded();
    await firstElementByTestID('receiver-name').sendKeys('MyReceiver');
    await firstElementByTestID('dropdown-button').click();
    await crudView.isLoaded();
    await dropdownMenuForTestID('pagerduty_configs').click();
    await crudView.isLoaded();
    await firstElementByTestID('integration-key').sendKeys('<integration_key>');
    await firstElementByTestID('label-name-0').sendKeys('severity');
    await firstElementByTestID('label-value-0').sendKeys('warning');

    expect(firstElementByTestID('pagerduty-url').getAttribute('value')).toEqual(
      'https://events.pagerduty.com/v2/enqueue',
    );

    // adv config options
    await monitoringView.showAdvancedConfiguration.click();
    expect(firstElementByTestID('send-resolved-alerts').getAttribute('checked')).toBeTruthy();
    expect(firstElementByTestID('pagerduty-client').getAttribute('value')).toEqual(
      '{{ template "pagerduty.default.client" . }}',
    );
    expect(firstElementByTestID('pagerduty-client-url').getAttribute('value')).toEqual(
      '{{ template "pagerduty.default.clientURL" . }}',
    );
    expect(firstElementByTestID('pagerduty-description').getAttribute('value')).toEqual(
      '{{ template "pagerduty.default.description" .}}',
    );
    expect(firstElementByTestID('pagerduty-severity').getAttribute('value')).toEqual('error');
    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys('MyReceiver');
    monitoringView.getFirstRowAsText().then((text) => {
      expect(text).toEqual('MyReceiver pagerduty severity = warning');
    });
  });

  it('saves globals correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));

    // monitoringView.saveAsDefault checkbox disabled when url equals global url
    expect(monitoringView.saveAsDefault.isEnabled()).toBeFalsy();

    // changing url, enables monitoringView.saveAsDefault unchecked, should save pagerduty_url with Receiver
    await fillInput(
      firstElementByTestID('pagerduty-url'),
      'http://pagerduty-url-specific-to-receiver',
    );
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy();
    expect(monitoringView.saveAsDefault.getAttribute('checked')).toBeFalsy();
    await monitoringView.saveButton.click();
    await crudView.isLoaded();

    //pagerduty_url should be saved with Receiver and not global
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    let yamlStr = await yamlView.getEditorContent();
    let configs = getGlobalsAndReceiverConfig('pagerduty_configs', yamlStr);
    expect(_.has(configs.globals, 'pagerduty_url')).toBeFalsy();
    expect(configs.receiverConfig.url).toBe('http://pagerduty-url-specific-to-receiver');

    // save pagerduty_url as default/global
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));
    await fillInput(firstElementByTestID('pagerduty-url'), 'http://global-pagerduty-url');
    await crudView.isLoaded();
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy();
    monitoringView.saveAsDefault.click();
    expect(monitoringView.saveAsDefault.getAttribute('checked')).toBeTruthy();
    await monitoringView.saveButton.click();
    await crudView.isLoaded();

    // pagerduty_url should be saved as global, not with Receiver
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    yamlStr = await yamlView.getEditorContent();
    configs = getGlobalsAndReceiverConfig('pagerduty_configs', yamlStr);
    expect(configs.globals.pagerduty_url).toBe('http://global-pagerduty-url');
    expect(_.has(configs.receiverConfig, 'url')).toBeFalsy();

    // save pagerduty url to receiver with an existing global
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));
    await fillInput(
      firstElementByTestID('pagerduty-url'),
      'http://pagerduty-url-specific-to-receiver',
    );
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy();
    expect(monitoringView.saveAsDefault.getAttribute('checked')).toBeFalsy();
    await monitoringView.saveButton.click();
    await crudView.isLoaded();

    // pagerduty_url should be saved with Receiver, as well as having a global pagerduty_url prop
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    yamlStr = await yamlView.getEditorContent();
    configs = getGlobalsAndReceiverConfig('pagerduty_configs', yamlStr);
    expect(configs.globals.pagerduty_url).toBe('http://global-pagerduty-url');
    expect(configs.receiverConfig.url).toBe('http://pagerduty-url-specific-to-receiver');
  });

  it('saves advanced configuration fields correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));

    await monitoringView.showAdvancedConfiguration.click();

    // change first 3 props so that they are diff from global values, thus saved to Receiver config
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeTruthy();
    await monitoringView.sendResolvedAlerts.click();
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeFalsy();
    await fillInput(firstElementByTestID('pagerduty-client'), 'updated-client');
    await fillInput(firstElementByTestID('pagerduty-client-url'), 'http://updated-client-url');

    await monitoringView.saveButton.click();
    await crudView.isLoaded();

    // 3 changed fields should be saved with Receiver.  description and severity should not be
    // saved with Receiver since they equal global values
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    let yamlStr = await yamlView.getEditorContent();
    let configs = getGlobalsAndReceiverConfig('pagerduty_configs', yamlStr);
    expect(configs.receiverConfig.send_resolved).toBeFalsy();
    expect(configs.receiverConfig.client).toBe('updated-client');
    expect(configs.receiverConfig.client_url).toBe('http://updated-client-url');
    expect(configs.receiverConfig.description).toBe(undefined);
    expect(configs.receiverConfig.severity).toBe(undefined);

    // restore default values for the 3, change desc and severity -which should then be saved
    // with Receiver while initial 3 are removed from Receiver config
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));
    await monitoringView.showAdvancedConfiguration.click();
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeFalsy();
    await monitoringView.sendResolvedAlerts.click();
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeTruthy();
    await fillInput(
      firstElementByTestID('pagerduty-client'),
      '{{ template "pagerduty.default.client" . }}',
    );
    await fillInput(
      firstElementByTestID('pagerduty-client-url'),
      '{{ template "pagerduty.default.clientURL" . }}',
    );
    await fillInput(firstElementByTestID('pagerduty-description'), 'new description');
    await fillInput(firstElementByTestID('pagerduty-severity'), 'warning');
    await monitoringView.saveButton.click();
    await crudView.isLoaded();

    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    yamlStr = await yamlView.getEditorContent();
    configs = getGlobalsAndReceiverConfig('pagerduty_configs', yamlStr);
    expect(configs.receiverConfig.send_resolved).toBe(undefined);
    expect(configs.receiverConfig.client).toBe(undefined);
    expect(configs.receiverConfig.client_url).toBe(undefined);
    expect(configs.receiverConfig.description).toBe('new description');
    expect(configs.receiverConfig.severity).toBe('warning');
  });
});

describe('Alertmanager: Email Receiver Form', () => {
  afterAll(() => {
    execSync(
      `kubectl patch secret 'alertmanager-main' -n 'openshift-monitoring' --type='json' -p='[{ op: 'replace', path: '/data/alertmanager.yaml', value: ${monitoringView.defaultAlertmanagerYaml}}]'`,
    );
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('creates Email Receiver correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig`);
    await crudView.isLoaded();
    await firstElementByTestID('create-receiver').click();
    await crudView.isLoaded();
    await fillInput(firstElementByTestID('receiver-name'), 'MyReceiver');
    await firstElementByTestID('dropdown-button').click();
    await crudView.isLoaded();
    await dropdownMenuForTestID('email_configs').click();
    await crudView.isLoaded();

    // check defaults
    expect(monitoringView.saveAsDefault.isEnabled()).toBeFalsy(); // prior to smtp change, monitoringView.saveAsDefault disabled
    expect(firstElementByTestID('email-hello').getAttribute('value')).toEqual('localhost');
    expect(firstElementByTestID('email-require-tls').getAttribute('checked')).toBeTruthy();
    // adv fields
    await monitoringView.showAdvancedConfiguration.click();
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeFalsy();
    expect(firstElementByTestID('email-html').getAttribute('value')).toEqual(
      '{{ template "email.default.html" . }}',
    );

    // change required fields
    await fillInput(firstElementByTestID('email-to'), 'you@there.com');
    await fillInput(firstElementByTestID('email-from'), 'me@here.com');
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy(); // monitoringView.saveAsDefault enabled
    await fillInput(firstElementByTestID('email-smarthost'), 'smarthost:8080');
    await fillInput(firstElementByTestID('label-name-0'), 'severity');
    await fillInput(firstElementByTestID('label-value-0'), 'warning');
    await monitoringView.saveButton.click();
    await crudView.isLoaded();

    // all required fields should be saved with Receiver and not globally
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    const yamlStr = await yamlView.getEditorContent();
    const configs = getGlobalsAndReceiverConfig('email_configs', yamlStr);
    expect(_.has(configs.globals, 'email_to')).toBeFalsy();
    expect(_.has(configs.globals, 'smtp_from')).toBeFalsy();
    expect(_.has(configs.globals, 'smtp_smarthost')).toBeFalsy();
    expect(_.has(configs.globals, 'smtp_require_tls')).toBeFalsy();
    expect(configs.receiverConfig.to).toBe('you@there.com');
    expect(configs.receiverConfig.from).toBe('me@here.com');
    expect(configs.receiverConfig.smarthost).toBe('smarthost:8080');
    expect(_.has(configs.receiverConfig, 'require_tls')).toBeFalsy(); // unchanged from global value
  });

  it('saves globals and advanced fields correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));

    // Check updated form fields
    expect(firstElementByTestID('email-to').getAttribute('value')).toEqual('you@there.com');
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy(); // smtp_from different from global
    expect(monitoringView.saveAsDefault.getAttribute('checked')).toBeFalsy();
    expect(firstElementByTestID('email-from').getAttribute('value')).toEqual('me@here.com');
    expect(firstElementByTestID('email-hello').getAttribute('value')).toEqual('localhost');

    // Change smtp global fields
    await fillInput(firstElementByTestID('email-auth-username'), 'username');
    await fillInput(firstElementByTestID('email-auth-password'), 'password');
    await fillInput(firstElementByTestID('email-auth-identity'), 'identity');
    await fillInput(firstElementByTestID('email-auth-secret'), 'secret');
    await firstElementByTestID('email-require-tls').click();

    // Change advanced fields
    await monitoringView.showAdvancedConfiguration.click();
    await monitoringView.sendResolvedAlerts.click();
    await fillInput(firstElementByTestID('email-html'), 'myhtml');
    await monitoringView.saveButton.click(); // monitoringView.saveAsDefault not checked, so all should be saved with Reciever
    await crudView.isLoaded();

    // all fields saved to receiver since save as default not checked
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();

    let yamlStr = await yamlView.getEditorContent();
    let configs = getGlobalsAndReceiverConfig('email_configs', yamlStr);
    expect(_.has(configs.globals, 'smtp_auth_username')).toBeFalsy();
    expect(configs.receiverConfig.auth_username).toBe('username');
    expect(configs.receiverConfig.auth_password).toBe('password');
    expect(configs.receiverConfig.auth_identity).toBe('identity');
    expect(configs.receiverConfig.auth_secret).toBe('secret');
    expect(configs.receiverConfig.require_tls).toBeFalsy();
    // adv fields
    expect(configs.receiverConfig.send_resolved).toBeTruthy();
    expect(configs.receiverConfig.html).toBe('myhtml');

    // Save As Default
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));
    monitoringView.saveAsDefault.click();
    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    // global fields saved in config.global
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    yamlStr = await yamlView.getEditorContent();
    configs = getGlobalsAndReceiverConfig('email_configs', yamlStr);
    expect(configs.globals.smtp_from).toBe('me@here.com');
    expect(configs.globals.smtp_hello).toBe('localhost');
    expect(configs.globals.smtp_smarthost).toBe('smarthost:8080');
    expect(configs.globals.smtp_auth_username).toBe('username');
    expect(configs.globals.smtp_auth_password).toBe('password');
    expect(configs.globals.smtp_auth_identity).toBe('identity');
    expect(configs.globals.smtp_auth_secret).toBe('secret');
    expect(configs.globals.smtp_require_tls).toBeFalsy();
    // non-global fields should still be saved with Receiver
    expect(configs.receiverConfig.to).toBe('you@there.com');
  });
});

describe('Alertmanager: Slack Receiver Form', () => {
  afterAll(() => {
    execSync(
      `kubectl patch secret 'alertmanager-main' -n 'openshift-monitoring' --type='json' -p='[{ op: 'replace', path: '/data/alertmanager.yaml', value: ${monitoringView.defaultAlertmanagerYaml}}]'`,
    );
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('creates Slack Receiver correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig`);
    await crudView.isLoaded();
    await firstElementByTestID('create-receiver').click();
    await crudView.isLoaded();
    await fillInput(firstElementByTestID('receiver-name'), 'MyReceiver');
    await firstElementByTestID('dropdown-button').click();
    await crudView.isLoaded();
    await dropdownMenuForTestID('slack_configs').click();
    await crudView.isLoaded();

    // check defaults
    expect(monitoringView.saveAsDefault.isEnabled()).toBeFalsy();
    // adv fields
    await monitoringView.showAdvancedConfiguration.click();
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeFalsy();
    expect(firstElementByTestID('slack-icon-url').getAttribute('value')).toEqual(
      '{{ template "slack.default.iconurl" .}}',
    );
    expect(firstElementByTestID('slack-icon-emoji').isPresent()).toBe(false);
    await firstElementByTestID('slack-icon-type-emoji').click();
    expect(firstElementByTestID('slack-icon-url').isPresent()).toBe(false);
    expect(firstElementByTestID('slack-icon-emoji').getAttribute('value')).toEqual(
      '{{ template "slack.default.iconemoji" .}}',
    );
    expect(firstElementByTestID('slack-username').getAttribute('value')).toEqual(
      '{{ template "slack.default.username" . }}',
    );
    expect(firstElementByTestID('slack-link-names').getAttribute('checked')).toBeFalsy();

    // change required fields
    await fillInput(firstElementByTestID('slack-api-url'), 'http://myslackapi');
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy(); // monitoringView.saveAsDefault enabled
    await fillInput(firstElementByTestID('slack-channel'), 'myslackchannel');
    await fillInput(firstElementByTestID('label-name-0'), 'severity');
    await fillInput(firstElementByTestID('label-value-0'), 'warning');
    await monitoringView.saveButton.click();
    await crudView.isLoaded();

    // all required fields should be saved with Receiver and not globally
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    const yamlStr = await yamlView.getEditorContent();
    const configs = getGlobalsAndReceiverConfig('slack_configs', yamlStr);
    expect(_.has(configs.globals, 'slack_api_url')).toBeFalsy();
    expect(configs.receiverConfig.channel).toBe('myslackchannel');
    expect(configs.receiverConfig.api_url).toBe('http://myslackapi');
    // make sure adv fields are not saved since they equal their global values
    expect(_.has(configs.receiverConfig, 'send_resolved')).toBeFalsy();
    expect(_.has(configs.receiverConfig, 'username')).toBeFalsy();
  });

  it('saves globals and advanced fields correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));

    // Check updated form fields
    expect(firstElementByTestID('slack-channel').getAttribute('value')).toEqual('myslackchannel');
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy(); // different from global
    expect(firstElementByTestID('slack-api-url').getAttribute('value')).toEqual(
      'http://myslackapi',
    );

    // Change advanced fields
    await monitoringView.showAdvancedConfiguration.click();
    await monitoringView.sendResolvedAlerts.click();
    await fillInput(firstElementByTestID('slack-icon-url'), 'http://myslackicon');
    await fillInput(firstElementByTestID('slack-username'), 'slackuser');
    await firstElementByTestID('slack-link-names').click();

    monitoringView.saveAsDefault.click();
    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await crudView.isLoaded();
    // check updated advanced form fields
    await monitoringView.showAdvancedConfiguration.click();
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeTruthy();
    expect(firstElementByTestID('slack-icon-url').getAttribute('value')).toEqual(
      'http://myslackicon',
    );
    expect(firstElementByTestID('slack-icon-emoji').isPresent()).toBe(false);
    expect(firstElementByTestID('slack-username').getAttribute('value')).toEqual('slackuser');
    expect(firstElementByTestID('slack-link-names').getAttribute('checked')).toBeTruthy();

    // check saved to slack receiver config yaml
    await browser.get(`${appHost}/monitoring/alertmanageryaml`);
    await yamlView.isLoaded();
    const yamlStr = await yamlView.getEditorContent();
    const configs = getGlobalsAndReceiverConfig('slack_configs', yamlStr);
    expect(configs.globals.slack_api_url).toBe('http://myslackapi');
    expect(_.has(configs.receiverConfig, 'api_url')).toBeFalsy();
    expect(configs.receiverConfig.channel).toBe('myslackchannel');
    // advanced fields
    expect(configs.receiverConfig.send_resolved).toBeTruthy();
    expect(configs.receiverConfig.icon_url).toBe('http://myslackicon');
    expect(configs.receiverConfig.username).toBe('slackuser');
    expect(configs.receiverConfig.link_names).toBeTruthy();
  });
});

describe('Alertmanager: Webhook Receiver Form', () => {
  afterAll(() => {
    execSync(
      `kubectl patch secret 'alertmanager-main' -n 'openshift-monitoring' --type='json' -p='[{ op: 'replace', path: '/data/alertmanager.yaml', value: ${monitoringView.defaultAlertmanagerYaml}}]'`,
    );
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('creates Webhook Receiver correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig`);
    await crudView.isLoaded();
    await firstElementByTestID('create-receiver').click();
    await crudView.isLoaded();
    await fillInput(firstElementByTestID('receiver-name'), 'MyReceiver');
    await firstElementByTestID('dropdown-button').click();
    await crudView.isLoaded();
    await dropdownMenuForTestID('webhook_configs').click();
    await crudView.isLoaded();

    // check adv field default value
    await monitoringView.showAdvancedConfiguration.click();
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeTruthy();

    // change required fields
    await fillInput(firstElementByTestID('webhook-url'), 'http://mywebhookurl');
    await fillInput(firstElementByTestID('label-name-0'), 'severity');
    await fillInput(firstElementByTestID('label-value-0'), 'warning');
    await monitoringView.saveButton.click();
    await crudView.isLoaded();

    // all required fields should be saved with Receiver
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    const yamlStr = await yamlView.getEditorContent();
    const configs = getGlobalsAndReceiverConfig('webhook_configs', yamlStr);
    expect(configs.receiverConfig.url).toBe('http://mywebhookurl');
    expect(_.has(configs.receiverConfig, 'send_resolved')).toBeFalsy();
  });

  it('edits Webhook Receiver and saves advanced fields correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));

    // Check updated form fields
    expect(firstElementByTestID('webhook-url').getAttribute('value')).toEqual(
      'http://mywebhookurl',
    );

    await fillInput(firstElementByTestID('webhook-url'), 'http://myupdatedwebhookurl');
    // Change advanced fields
    await monitoringView.showAdvancedConfiguration.click();
    await monitoringView.sendResolvedAlerts.click();

    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await crudView.isLoaded();
    // check updated advanced form fields
    await monitoringView.showAdvancedConfiguration.click();
    expect(monitoringView.sendResolvedAlerts.getAttribute('checked')).toBeFalsy();

    // check saved to slack receiver config yaml
    await browser.get(`${appHost}/monitoring/alertmanageryaml`);
    await yamlView.isLoaded();
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    const yamlStr = await yamlView.getEditorContent();
    const configs = getGlobalsAndReceiverConfig('webhook_configs', yamlStr);
    expect(configs.receiverConfig.url).toBe('http://myupdatedwebhookurl');
    // advanced field
    expect(configs.receiverConfig.send_resolved).toBeFalsy();
  });
});
