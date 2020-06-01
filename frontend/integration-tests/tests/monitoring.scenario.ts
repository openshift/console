import { browser, ExpectedConditions as until } from 'protractor';

import { checkLogs, checkErrors, firstElementByTestID, appHost } from '../protractor.conf';
import { dropdownMenuForTestID } from '../views/form.view';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';
import * as monitoringView from '../views/monitoring.view';
import * as namespaceView from '../views/namespace.view';
import * as sidenavView from '../views/sidenav.view';
import * as horizontalnavView from '../views/horizontal-nav.view';
import { execSync } from 'child_process';

const testAlertName = 'Watchdog';

const testDetailsPage = (subTitle, alertName, expectLabel = true) => {
  expect(monitoringView.detailsHeading.getText()).toContain(alertName);
  expect(monitoringView.detailsSubHeadings.first().getText()).toContain(subTitle);
  if (expectLabel) {
    expect(monitoringView.labels.first().getText()).toEqual(`alertname\n=\n${alertName}`);
  }
};

const testSilenceTimeInputs = async () => {
  // Default start and end times
  expect(monitoringView.silenceStartNowCheckbox.getAttribute('checked')).toBeTruthy();
  await browser.wait(until.presenceOf(monitoringView.silenceStartsAtInput));
  expect(monitoringView.silenceStartsAtInput.getAttribute('value')).toEqual('Now');
  expect(monitoringView.silenceDurationMenuButton.getText()).toEqual('2h');
  expect(monitoringView.silenceEndsAtInput.getAttribute('value')).toEqual('2h from now');

  // Change duration
  await monitoringView.silenceDurationMenuButton.click();
  await monitoringView.wait(until.elementToBeClickable(monitoringView.silenceDurationOption('1h')));
  await monitoringView.silenceDurationOption('1h').click();
  expect(monitoringView.silenceEndsAtInput.getAttribute('value')).toEqual('1h from now');

  // Change to not start now
  await monitoringView.silenceStartNowCheckbox.click();
  expect(monitoringView.silenceStartNowCheckbox.getAttribute('checked')).toBeFalsy();
  // Allow for some difference in times
  expect(monitoringView.silenceStartsAtInput.getAttribute('value')).not.toEqual('Now');
  expect(monitoringView.silenceStartsAtInput.getAttribute('value')).toBeTruthy();
  monitoringView.silenceStartsAtInput.getAttribute('value').then((start: string) => {
    expect(Date.parse(start) - Date.now()).toBeLessThan(10000);
    monitoringView.silenceEndsAtInput.getAttribute('value').then((end: string) => {
      expect(Date.parse(end) - Date.parse(start)).toEqual(60 * 60 * 1000);
    });
  });

  // Invalid start time
  await monitoringView.silenceStartsAtInput.sendKeys('abc');
  expect(monitoringView.silenceEndsAtInput.getAttribute('value')).toEqual('-');

  // Change to back to start now
  await monitoringView.silenceStartNowCheckbox.click();
  expect(monitoringView.silenceStartNowCheckbox.getAttribute('checked')).toBeTruthy();
  expect(monitoringView.silenceEndsAtInput.getAttribute('value')).toEqual('1h from now');

  // Change duration back again
  await monitoringView.silenceDurationMenuButton.click();
  await monitoringView.wait(until.presenceOf(monitoringView.silenceDurationOption('2h')));
  await monitoringView.silenceDurationOption('2h').click();
  expect(monitoringView.silenceEndsAtInput.getAttribute('value')).toEqual('2h from now');
};

describe('Monitoring: Alerts', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays the Alerts list page', async () => {
    await sidenavView.clickNavLink(['Monitoring', 'Alerting']);
    await crudView.isLoaded();
    expect(monitoringView.listPageHeading.getText()).toContain('Alerting');
  });

  it('does not have a namespace dropdown', async () => {
    expect(namespaceView.namespaceSelector.isPresent()).toBe(false);
  });

  it('filters Alerts by name', async () => {
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.sendKeys(testAlertName);
    expect(firstElementByTestID('alert-resource-link').getText()).toContain(testAlertName);
  });

  it('displays Alert details page', async () => {
    await monitoringView.wait(
      until.elementToBeClickable(firstElementByTestID('alert-resource-link')),
    );
    expect(firstElementByTestID('alert-resource-link').getText()).toContain(testAlertName);
    await firstElementByTestID('alert-resource-link').click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingAlertIcon));
    testDetailsPage('Alert Detail', testAlertName);
  });

  it('links to the Alerting Rule details page', async () => {
    expect(monitoringView.ruleLink.getText()).toContain(testAlertName);
    await monitoringView.ruleLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingRuleIcon));
    testDetailsPage('Alerting Rule Details', testAlertName, false);

    // Active Alerts list should contain a link back to the Alert details page
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstAlertsListLink));
    await monitoringView.firstAlertsListLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingAlertIcon));
    testDetailsPage('Alert Details', testAlertName);
  });

  it('creates a new Silence from an existing alert', async () => {
    await monitoringView.actionButton.click();
    await monitoringView.wait(until.presenceOf(monitoringView.saveButton));
    await testSilenceTimeInputs();
    await monitoringView.commentTextarea.sendKeys('Test Comment');
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);

    // After creating the Silence, should be redirected to its details page
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Details', testAlertName);
  });

  it('shows the silenced Alert in the Silenced Alerts list', async () => {
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstAlertsListLink));
    expect(monitoringView.firstAlertsListLink.getText()).toContain(testAlertName);

    // Click the link to navigate back to the Alert details link
    await monitoringView.firstAlertsListLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingAlertIcon));
    testDetailsPage('Alert Details', testAlertName);
  });

  it('shows the newly created Silence in the Silenced By list', async () => {
    await monitoringView.wait(
      until.elementToBeClickable(firstElementByTestID('silence-resource-link')),
    );
    expect(firstElementByTestID('silence-resource-link').getText()).toContain(testAlertName);

    // Click the link to navigate back to the Silence details page
    await firstElementByTestID('silence-resource-link').click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Details', testAlertName);
  });

  it('expires the Silence', async () => {
    await crudView.clickDetailsPageAction('Expire Silence');
    await monitoringView.wait(until.elementToBeClickable(monitoringView.modalConfirmButton));
    await monitoringView.modalConfirmButton.click();
    await monitoringView.wait(until.presenceOf(monitoringView.expiredSilenceIcon));
  });
});

describe('Monitoring: Silences', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays the Silences list page', async () => {
    await sidenavView.clickNavLink(['Monitoring', 'Alerting']);
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('Silences');
    await monitoringView.wait(until.presenceOf(monitoringView.createButton));
  });

  it('does not have a namespace dropdown', async () => {
    expect(namespaceView.namespaceSelector.isPresent()).toBe(false);
  });

  it('creates a new Silence', async () => {
    await monitoringView.createButton.click();
    await monitoringView.wait(until.presenceOf(monitoringView.matcherNameInput));
    await testSilenceTimeInputs();
    await monitoringView.matcherNameInput.sendKeys('alertname');
    await monitoringView.matcherValueInput.sendKeys(testAlertName);
    await monitoringView.commentTextarea.sendKeys('Test Comment');
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);
  });

  // After creating the Silence, should be redirected to its details page
  it('displays detail view for new Silence', async () => {
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Details', testAlertName);
  });

  it('filters Silences by name', async () => {
    await sidenavView.clickNavLink(['Monitoring', 'Alerting']);
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('Silences');
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.sendKeys(testAlertName);
    expect(firstElementByTestID('silence-resource-link').getText()).toContain(testAlertName);
  });

  it('displays Silence details page', async () => {
    await monitoringView.wait(
      until.elementToBeClickable(firstElementByTestID('silence-resource-link')),
    );
    expect(firstElementByTestID('silence-resource-link').getText()).toContain(testAlertName);
    await firstElementByTestID('silence-resource-link').click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Details', testAlertName);
  });

  it('edits the Silence', async () => {
    await crudView.clickDetailsPageAction('Edit Silence');
    await monitoringView.wait(until.presenceOf(monitoringView.commentTextarea));
    await monitoringView.commentTextarea.sendKeys(' (edited)');
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);

    // After editing the Silence, should be redirected to its details page, where we check that the edit is reflected
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Details', testAlertName);
    expect(monitoringView.silenceComment.getText()).toEqual('Test Comment (edited)');
  });

  it('expires the Silence', async () => {
    await sidenavView.clickNavLink(['Monitoring', 'Alerting']);
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('Silences');
    await crudView.nameFilter.sendKeys(testAlertName);
    const row = crudView.rowForName(testAlertName);
    await monitoringView.wait(until.presenceOf(row));
    await crudView.clickKebabAction(testAlertName, 'Expire Silence');
    await monitoringView.wait(until.elementToBeClickable(monitoringView.modalConfirmButton));
    await monitoringView.modalConfirmButton.click();
    await monitoringView.wait(until.not(until.presenceOf(row)));
  });
});

describe('Alertmanager: YAML', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays the Alertmanager YAML page', async () => {
    await sidenavView.clickNavLink(['Administration', 'Cluster Settings']);
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('Global Configuration');
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(firstElementByTestID('alertmanager')));
    expect(firstElementByTestID('alertmanager').getText()).toContain('Alertmanager');
    await firstElementByTestID('alertmanager').click();
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    expect(yamlView.yamlEditor.isPresent()).toBe(true);
  });

  it('saves Alertmanager YAML', async () => {
    expect(monitoringView.successAlert.isPresent()).toBe(false);
    await yamlView.saveButton.click();
    await yamlView.isLoaded();
    expect(monitoringView.successAlert.isPresent()).toBe(true);
  });
});

describe('Alertmanager: Configuration', () => {
  afterAll(() => {
    execSync(
      `kubectl patch secret 'alertmanager-main' -n 'openshift-monitoring' --type='json' -p='[{ op: 'replace', path: '/data/alertmanager.yaml', value: ${monitoringView.defaultAlertmanagerYaml}}]'`,
    );
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays the Alertmanager Configuration Details page', async () => {
    await browser.get(`${appHost}/monitoring/alertmanagerconfig`);
    await crudView.isLoaded();
    expect(monitoringView.alertRoutingHeader.getText()).toContain('Alert Routing');
  });

  it('launches Alert Routing modal, edits and saves correctly', async () => {
    await crudView.isLoaded();
    expect(monitoringView.alertRoutingEditButton.isPresent()).toBe(true);
    await monitoringView.alertRoutingEditButton.click();
    await crudView.isLoaded();

    await browser.wait(until.elementToBeClickable(firstElementByTestID('input-group-by')));
    await firstElementByTestID('input-group-by').sendKeys(', cluster');
    await firstElementByTestID('input-group-wait').clear();
    await firstElementByTestID('input-group-wait').sendKeys('60s');
    await firstElementByTestID('input-group-interval').clear();
    await firstElementByTestID('input-group-interval').sendKeys('10m');
    await firstElementByTestID('input-repeat-interval').clear();
    await firstElementByTestID('input-repeat-interval').sendKeys('24h');

    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    expect(firstElementByTestID('group_by_value').getText()).toContain(', cluster');
    expect(firstElementByTestID('group_wait_value').getText()).toEqual('60s');
    expect(firstElementByTestID('group_interval_value').getText()).toEqual('10m');
    expect(firstElementByTestID('repeat_interval_value').getText()).toEqual('24h');
  });

  it('creates a receiver correctly', async () => {
    await crudView.isLoaded();
    await firstElementByTestID('create-receiver').click();
    await crudView.isLoaded();

    // these are hidden and disabled until receiverType selected
    expect(firstElementByTestID('pagerduty-receiver-form').isPresent()).toBe(false);
    expect(firstElementByTestID('receiver-routing-labels-editor').isPresent()).toBe(false);
    expect(monitoringView.saveButton.isEnabled()).toBe(false);

    await firstElementByTestID('receiver-name').sendKeys('MyReceiver');
    await firstElementByTestID('dropdown-button').click();
    await crudView.isLoaded();

    await dropdownMenuForTestID('pagerduty_configs').click();
    await crudView.isLoaded();

    // these should be shown after receiverType selected
    expect(firstElementByTestID('pagerduty-receiver-form').isPresent()).toBe(true);
    expect(firstElementByTestID('receiver-routing-labels-editor').isPresent()).toBe(true);

    expect(firstElementByTestID('pagerduty-key-label').getText()).toEqual('Routing Key');
    await firstElementByTestID('integration-type-prometheus').click();
    expect(firstElementByTestID('pagerduty-key-label').getText()).toEqual('Service Key');

    // pagerduty subform should still be invalid at this point, thus save button should be disabled
    expect(monitoringView.saveButton.isEnabled()).toBe(false);
    await firstElementByTestID('integration-key').sendKeys('<integration_key>');

    // labels
    expect(firstElementByTestID('invalid-label-name-error').isPresent()).toBe(false);
    await firstElementByTestID('label-name-0').sendKeys('9abcgo'); // invalid, cannot start with digit
    expect(firstElementByTestID('invalid-label-name-error').isPresent()).toBe(true);
    await firstElementByTestID('label-name-0').clear();
    await firstElementByTestID('label-name-0').sendKeys('_abcd'); // valid, can start with and contain '_'
    expect(firstElementByTestID('invalid-label-name-error').isPresent()).toBe(false);
    await firstElementByTestID('label-name-0').clear();
    await firstElementByTestID('label-name-0').sendKeys('abcd@#$R@T%'); // invalid chars
    expect(firstElementByTestID('invalid-label-name-error').isPresent()).toBe(true);
    await firstElementByTestID('label-name-0').clear();
    expect(firstElementByTestID('duplicate-label-name-error').isPresent()).toBe(false);
    await firstElementByTestID('label-name-0').sendKeys('severity');
    expect(firstElementByTestID('invalid-label-name-error').isPresent()).toBe(false);
    await firstElementByTestID('label-value-0').sendKeys('warning');
    await firstElementByTestID('add-routing-label').click();
    await firstElementByTestID('label-name-1').sendKeys('severity');
    await firstElementByTestID('label-value-1').sendKeys('warning');
    expect(firstElementByTestID('duplicate-label-name-error').isPresent()).toBe(true);
    await firstElementByTestID('remove-routing-label').click();
    expect(firstElementByTestID('duplicate-label-name-error').isPresent()).toBe(false);

    expect(monitoringView.saveButton.isEnabled()).toBe(true); // subform valid & labels provided, save should be enabled at this point
    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys('MyReceiver');
    monitoringView.getFirstRowAsText().then((text) => {
      expect(text).toEqual('MyReceiver pagerduty severity = warning');
    });
  });

  it('edits a receiver correctly', async () => {
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys('MyReceiver');
    expect(crudView.resourceRows.count()).toBe(1);
    await monitoringView.clickFirstRowKebabAction('Edit Receiver');
    await browser.wait(until.presenceOf(firstElementByTestID('cancel')));
    expect(firstElementByTestID('receiver-name').getAttribute('value')).toEqual('MyReceiver');
    expect(firstElementByTestID('dropdown-button').getText()).toEqual('PagerDuty');
    expect(firstElementByTestID('pagerduty-key-label').getText()).toEqual('Service Key');
    expect(firstElementByTestID('integration-key').getAttribute('value')).toEqual(
      '<integration_key>',
    );
    expect(firstElementByTestID('label-name-0').getAttribute('value')).toEqual('severity');
    expect(firstElementByTestID('label-value-0').getAttribute('value')).toEqual('warning');

    // Edit Values

    await firstElementByTestID('receiver-name').clear();
    await firstElementByTestID('receiver-name').sendKeys('MyEditedReceiver');
    await firstElementByTestID('label-name-0').clear();
    await firstElementByTestID('label-name-0').sendKeys('cluster');
    await firstElementByTestID('label-value-0').clear();
    await firstElementByTestID('label-value-0').sendKeys('MyCluster');

    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys('MyEditedReceiver');
    monitoringView.getFirstRowAsText().then((text) => {
      expect(text).toEqual('MyEditedReceiver pagerduty cluster = MyCluster');
    });
  });

  it('deletes a receiver correctly', async () => {
    await horizontalnavView.clickHorizontalTab('Details');
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys('MyEditedReceiver');
    expect(crudView.resourceRows.count()).toBe(1);

    await monitoringView.clickFirstRowKebabAction('Delete Receiver');
    await browser.wait(until.presenceOf(monitoringView.saveButton));
    await monitoringView.saveButton.click();

    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys('MyEditedReceiver');
    expect(crudView.resourceRows.count()).toBe(0);
  });

  it('prevents deletion of default receiver', async () => {
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys('Default');
    await monitoringView.openFirstRowKebabMenu();
    expect(monitoringView.disabledDeleteReceiverMenuItem.isPresent()).toBe(true);
  });

  it('prevents deletion and form edit of a receiver with sub-route', async () => {
    // add receiver with sub-route
    const yaml = `route:
  routes:
    - match:
      service: database
      receiver: team-DB-pager
      routes:
        - match:
          owner: team-X
          receiver: team-X-pager
receivers:
- name: 'team-X-pager'
- name: 'team-DB-pager'`;
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    await yamlView.setEditorContent(yaml);
    await yamlView.saveButton.click();
    await yamlView.isLoaded();
    expect(monitoringView.successAlert.isPresent()).toBe(true);

    await horizontalnavView.clickHorizontalTab('Details');
    await monitoringView.openFirstRowKebabMenu();
    expect(monitoringView.disabledDeleteReceiverMenuItem.isPresent()).toBe(true);
    expect(crudView.actionForLabel('Edit YAML').isPresent()).toBe(true); // should be 'Edit YAML' not 'Edit Receiver'
  });
});
