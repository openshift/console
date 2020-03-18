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

    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys('MyReceiver');
    monitoringView.getFirstRowAsText().then((text) => {
      expect(text).toEqual('MyReceiver pagerduty severity = warning');
    });
  });

  it('saves as default/global correctly', async () => {
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

  it('saves as default/global correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));

    // Check Updated Values
    expect(firstElementByTestID('email-to').getAttribute('value')).toEqual('you@there.com');
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy(); // smtp_from different from global
    expect(monitoringView.saveAsDefault.getAttribute('checked')).toBeFalsy();
    expect(firstElementByTestID('email-from').getAttribute('value')).toEqual('me@here.com');
    expect(firstElementByTestID('email-hello').getAttribute('value')).toEqual('localhost');

    // Change All Remaining Fields
    await fillInput(firstElementByTestID('email-auth-username'), 'username');
    await fillInput(firstElementByTestID('email-auth-password'), 'password');
    await fillInput(firstElementByTestID('email-auth-identity'), 'identity');
    await fillInput(firstElementByTestID('email-auth-secret'), 'secret');
    await firstElementByTestID('email-require-tls').click();

    await monitoringView.saveButton.click(); // monitoringView.saveAsDefault not checked, so all should be saved with Reciever
    await crudView.isLoaded();

    // all fields saved with Receiver
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
  });

  it('saves as default/global correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));

    // Check Updated Values
    expect(firstElementByTestID('slack-channel').getAttribute('value')).toEqual('myslackchannel');
    expect(monitoringView.saveAsDefault.isEnabled()).toBeTruthy(); // different from global
    expect(firstElementByTestID('slack-api-url').getAttribute('value')).toEqual(
      'http://myslackapi',
    );

    monitoringView.saveAsDefault.click(); // save in global section
    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    const yamlStr = await yamlView.getEditorContent();
    const configs = getGlobalsAndReceiverConfig('slack_configs', yamlStr);
    expect(configs.globals.slack_api_url).toBe('http://myslackapi');
    expect(_.has(configs.receiverConfig, 'api_url')).toBeFalsy();
    expect(configs.receiverConfig.channel).toBe('myslackchannel');
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
  });

  it('edits Webhook Receiver correctly', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig/receivers/MyReceiver/edit`);
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));

    // Check Updated Values
    expect(firstElementByTestID('webhook-url').getAttribute('value')).toEqual(
      'http://mywebhookurl',
    );
    await fillInput(firstElementByTestID('webhook-url'), 'http://myupdatedwebhookurl');
    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    const yamlStr = await yamlView.getEditorContent();
    const configs = getGlobalsAndReceiverConfig('webhook_configs', yamlStr);
    expect(configs.receiverConfig.url).toBe('http://myupdatedwebhookurl');
  });
});
