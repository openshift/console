import { browser, ExpectedConditions as until } from 'protractor';

import { checkLogs, checkErrors, firstElementByTestID } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as yamlView from '../views/yaml.view';
import * as monitoringView from '../views/monitoring.view';
import * as namespaceView from '../views/namespace.view';
import * as sidenavView from '../views/sidenav.view';
import * as horizontalnavView from '../views/horizontal-nav.view';

const testAlertName = 'Watchdog';

const testDetailsPage = (subTitle, alertName, expectLabel = true) => {
  expect(monitoringView.detailsHeading.getText()).toContain(alertName);
  expect(monitoringView.detailsSubHeadings.first().getText()).toContain(subTitle);
  if (expectLabel) {
    expect(monitoringView.labels.first().getText()).toEqual(`alertname\n=\n${alertName}`);
  }
};

// Temporarily disable until OAuth proxy bug https://bugzilla.redhat.com/show_bug.cgi?id=1788419 is fixed
xdescribe('Bug 1788419 - Monitoring: Alerts', () => {
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
    testDetailsPage('Alert Overview', testAlertName);
  });

  it('links to the Alerting Rule details page', async () => {
    expect(monitoringView.ruleLink.getText()).toContain(testAlertName);
    await monitoringView.ruleLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingRuleIcon));
    testDetailsPage('Alerting Rule Overview', testAlertName, false);

    // Active Alerts list should contain a link back to the Alert details page
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstAlertsListLink));
    await monitoringView.firstAlertsListLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingAlertIcon));
    testDetailsPage('Alert Overview', testAlertName);
  });

  it('creates a new Silence from an existing alert', async () => {
    await crudView.clickDetailsPageAction('Silence Alert');
    await monitoringView.wait(until.presenceOf(monitoringView.saveButton));
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);

    // After creating the Silence, should be redirected to its details page
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
  });

  it('shows the silenced Alert in the Silenced Alerts list', async () => {
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstAlertsListLink));
    expect(monitoringView.firstAlertsListLink.getText()).toContain(testAlertName);

    // Click the link to navigate back to the Alert details link
    await monitoringView.firstAlertsListLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingAlertIcon));
    testDetailsPage('Alert Overview', testAlertName);
  });

  it('shows the newly created Silence in the Silenced By list', async () => {
    await monitoringView.wait(
      until.elementToBeClickable(firstElementByTestID('silence-resource-link')),
    );
    expect(firstElementByTestID('silence-resource-link').getText()).toContain(testAlertName);

    // Click the link to navigate back to the Silence details page
    await firstElementByTestID('silence-resource-link').click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
  });

  it('expires the Silence', async () => {
    await crudView.clickDetailsPageAction('Expire Silence');
    await monitoringView.wait(until.elementToBeClickable(monitoringView.modalConfirmButton));
    await monitoringView.modalConfirmButton.click();
    await monitoringView.wait(until.presenceOf(monitoringView.expiredSilenceIcon));
  });
});

// Temporarily disable until OAuth proxy bug https://bugzilla.redhat.com/show_bug.cgi?id=1788419 is fixed
xdescribe('Bug 1788419 - Monitoring: Silences', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays the Silences list page', async () => {
    await sidenavView.clickNavLink(['Monitoring', 'Alerting']);
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('Silences');
    expect(monitoringView.helpText.getText()).toContain(
      'Silences temporarily mute alerts based on a set of conditions',
    );
  });

  it('does not have a namespace dropdown', async () => {
    expect(namespaceView.namespaceSelector.isPresent()).toBe(false);
  });

  it('creates a new Silence', async () => {
    await monitoringView.createButton.click();
    await monitoringView.wait(until.presenceOf(monitoringView.matcherNameInput));
    await monitoringView.matcherNameInput.sendKeys('alertname');
    await monitoringView.matcherValueInput.sendKeys(testAlertName);
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);
  });

  // After creating the Silence, should be redirected to its details page
  it('displays detail view for new Silence', async () => {
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
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
    testDetailsPage('Silence Overview', testAlertName);
  });

  it('edits the Silence', async () => {
    await crudView.clickDetailsPageAction('Edit Silence');
    await monitoringView.wait(until.presenceOf(monitoringView.commentTextarea));
    await monitoringView.commentTextarea.sendKeys('Test Comment');
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);

    // After editing the Silence, should be redirected to its details page, where we check that the edit is reflected
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
    expect(monitoringView.silenceComment.getText()).toEqual('Test Comment');
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

  it('displays the Alermanager YAML page', async () => {
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
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays the Alermanager Configuration Overview page', async () => {
    await sidenavView.clickNavLink(['Administration', 'Cluster Settings']);
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('Global Configuration');
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(firstElementByTestID('alertmanager')));
    expect(firstElementByTestID('alertmanager').getText()).toContain('Alertmanager');
    await firstElementByTestID('alertmanager').click();
    await crudView.isLoaded();
    expect(monitoringView.alertRoutingHeader.getText()).toContain('Alert Routing');
  });

  it('launches Alert Routing modal, edits and saves correctly', async () => {
    await crudView.isLoaded();
    expect(monitoringView.alertRoutingEditButton.isPresent()).toBe(true);
    await monitoringView.alertRoutingEditButton.click();
    await crudView.isLoaded();

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

  it('creates PagerDuty Receiver correctly', async () => {
    await crudView.isLoaded();
    expect(firstElementByTestID('create-receiver').isPresent()).toBe(true);
    await firstElementByTestID('create-receiver').click();
    await crudView.isLoaded();

    // these are hidden and disabled until receiverType selected
    expect(firstElementByTestID('pagerduty-receiver-form').isPresent()).toBe(false);
    expect(firstElementByTestID('receiver-routing-labels-editor').isPresent()).toBe(false);
    expect(monitoringView.saveButton.isEnabled()).toBe(false);

    expect(firstElementByTestID('receiver-name').isPresent()).toBe(true);
    await firstElementByTestID('receiver-name').sendKeys('MyReceiver');

    expect(firstElementByTestID('dropdown-button').isDisplayed()).toBe(true);
    await firstElementByTestID('dropdown-button').click();
    await crudView.isLoaded();

    expect(firstElementByTestID('dropdown-menu').isDisplayed()).toBe(true);
    await firstElementByTestID('dropdown-menu').click();
    await crudView.isLoaded();

    // these should be shown after receiverType selected
    expect(firstElementByTestID('pagerduty-receiver-form').isPresent()).toBe(true);
    expect(firstElementByTestID('receiver-routing-labels-editor').isPresent()).toBe(true);

    expect(firstElementByTestID('pagerduty-key-label').getText()).toEqual('Routing Key');
    await firstElementByTestID('integration-type-prometheus').click();
    expect(firstElementByTestID('pagerduty-key-label').getText()).toEqual('Service Key');
    await firstElementByTestID('integration-key').sendKeys('<integration_key>');

    expect(monitoringView.saveButton.isEnabled()).toBe(true); // should be enabled at this point

    await firstElementByTestID('label-name-0').sendKeys('severity');
    await firstElementByTestID('label-value-0').sendKeys('warning');

    await monitoringView.saveButton.click();
    await crudView.isLoaded();
    monitoringView.getFirstRowAsText().then((text) => {
      expect(text).toEqual('MyReceiver pagerduty severity = warning');
    });
  });

  it('edits PagerDuty Receiver correctly', async () => {
    await crudView.isLoaded();
    expect(crudView.resourceRows.count()).toBe(2);
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

    monitoringView.getFirstRowAsText().then((text) => {
      expect(text).toEqual('MyEditedReceiver pagerduty cluster = MyCluster');
    });
  });

  it('deletes PagerDuty Receiver correctly', async () => {
    await crudView.isLoaded();
    expect(crudView.resourceRows.count()).toBe(2);

    await monitoringView.clickFirstRowKebabAction('Delete Receiver');
    await browser.wait(until.presenceOf(monitoringView.saveButton));
    await monitoringView.saveButton.click();

    await crudView.isLoaded();
    expect(crudView.resourceRows.count()).toBe(1);
  });

  it('prevents deletion of default receiver', async () => {
    await crudView.isLoaded();
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

    await horizontalnavView.clickHorizontalTab('Overview');
    await monitoringView.openFirstRowKebabMenu();
    expect(monitoringView.disabledDeleteReceiverMenuItem.isPresent()).toBe(true);
    expect(crudView.actionForLabel('Edit YAML').isPresent()).toBe(true); // should be 'Edit YAML' not 'Edit Receiver'
  });

  it('restores default/initial alertmanager.yaml', async () => {
    // add receiver with sub-route
    const defaultAlertmanagerYaml = `"global":
  "resolve_timeout": "5m"
"receivers":
- "name": "null"
"route":
  "group_by":
  - "job"
  "group_interval": "5m"
  "group_wait": "30s"
  "receiver": "null"
  "repeat_interval": "12h"
  "routes":
  - "match":
      "alertname": "Watchdog"
    "receiver": "null"`;

    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('YAML');
    await yamlView.isLoaded();
    await yamlView.setEditorContent(defaultAlertmanagerYaml);
    await yamlView.saveButton.click();
    await yamlView.isLoaded();
    expect(monitoringView.successAlert.isPresent()).toBe(true);
  });
});
