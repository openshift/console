import { by, ExpectedConditions as until } from 'protractor';

import { checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as monitoringView from '../views/monitoring.view';
import * as namespaceView from '../views/namespace.view';
import * as sidenavView from '../views/sidenav.view';

const testAlertName = 'Watchdog';

const testDetailsPage = (subTitle, alertName, expectLabel = true) => {
  expect(monitoringView.detailsHeading.getText()).toContain(alertName);
  expect(monitoringView.detailsSubHeadings.first().getText()).toContain(subTitle);
  if (expectLabel) {
    expect(monitoringView.labels.first().getText()).toEqual(`alertname\n=\n${alertName}`);
  }
};

describe('Monitoring: Alerts', () => {
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays the Alerts list page', async() => {
    await sidenavView.clickNavLink(['Monitoring', 'Alerts']);
    await crudView.isLoaded();
    expect(monitoringView.listPageHeading.getText()).toContain('Alerts');
  });

  it('does not have a namespace dropdown', async() => {
    expect(namespaceView.namespaceSelector.isPresent()).toBe(false);
  });

  it('filters Alerts by name', async() => {
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.sendKeys(testAlertName);
    expect(monitoringView.firstListLink.getText()).toContain(testAlertName);
  });

  it('displays Alert details page', async() => {
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstListLink));
    expect(monitoringView.firstListLink.getText()).toContain(testAlertName);
    await monitoringView.firstListLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingAlertIcon));
    testDetailsPage('Alert Overview', testAlertName);
  });

  it('links to the Alerting Rule details page', async() => {
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

  it('creates a new Silence from an existing alert', async() => {
    await monitoringView.clickActionsMenuAction('Silence Alert');
    await monitoringView.wait(until.presenceOf(monitoringView.saveButton));
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);

    // After creating the Silence, should be redirected to its details page
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
  });

  it('shows the silenced Alert in the Silenced Alerts list', async() => {
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstAlertsListLink));
    expect(monitoringView.firstAlertsListLink.getText()).toContain(testAlertName);

    // Click the link to navigate back to the Alert details link
    await monitoringView.firstAlertsListLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingAlertIcon));
    testDetailsPage('Alert Overview', testAlertName);
  });

  it('shows the newly created Silence in the Silenced By list', async() => {
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstListLink));
    expect(monitoringView.firstListLink.getText()).toContain(testAlertName);

    // Click the link to navigate back to the Silence details page
    await monitoringView.firstListLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
  });

  it('expires the Silence', async() => {
    await monitoringView.clickActionsMenuAction('Expire Silence');
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

  it('displays the Silences list page', async() => {
    await sidenavView.clickNavLink(['Monitoring', 'Silences']);
    await crudView.isLoaded();
    expect(monitoringView.listPageHeading.getText()).toContain('Silences');
  });

  it('does not have a namespace dropdown', async() => {
    expect(namespaceView.namespaceSelector.isPresent()).toBe(false);
  });

  it('creates a new Silence', async() => {
    await monitoringView.createButton.click();
    await monitoringView.wait(until.presenceOf(monitoringView.matcherNameInput));
    await monitoringView.matcherNameInput.sendKeys('alertname');
    await monitoringView.matcherValueInput.sendKeys(testAlertName);
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);
  });

  // After creating the Silence, should be redirected to its details page
  it('displays detail view for new Silence', async() => {
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
  });

  it('filters Silences by name', async() => {
    await sidenavView.clickNavLink(['Monitoring', 'Silences']);
    await crudView.isLoaded();
    await monitoringView.wait(until.elementToBeClickable(crudView.nameFilter));
    await crudView.nameFilter.sendKeys(testAlertName);
    expect(monitoringView.firstListLink.getText()).toContain(testAlertName);
  });

  it('displays Silence details page', async() => {
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstListLink));
    expect(monitoringView.firstListLink.getText()).toContain(testAlertName);
    await monitoringView.firstListLink.click();
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
  });

  it('edits the Silence', async() => {
    await monitoringView.clickActionsMenuAction('Edit Silence');
    await monitoringView.wait(until.presenceOf(monitoringView.commentTextarea));
    await monitoringView.commentTextarea.sendKeys('Test Comment');
    await monitoringView.saveButton.click();
    expect(crudView.errorMessage.isPresent()).toBe(false);

    // After editing the Silence, should be redirected to its details page, where we check that the edit is reflected
    await monitoringView.wait(until.presenceOf(monitoringView.detailsHeadingSilenceIcon));
    testDetailsPage('Silence Overview', testAlertName);
    expect(monitoringView.silenceComment.getText()).toEqual('Test Comment');
  });

  it('expires the Silence', async() => {
    await sidenavView.clickNavLink(['Monitoring', 'Silences']);
    await crudView.isLoaded();
    await crudView.nameFilter.sendKeys(testAlertName);
    await monitoringView.wait(until.elementToBeClickable(monitoringView.firstListLink));

    const row = crudView.rowForName(testAlertName);
    await monitoringView.wait(until.presenceOf(row));
    const menuButton = monitoringView.rowMenuButton(row);
    await monitoringView.wait(until.elementToBeClickable(menuButton));
    await menuButton.click();
    await row.element(by.linkText('Expire Silence')).click();
    await monitoringView.wait(until.elementToBeClickable(monitoringView.modalConfirmButton));
    await monitoringView.modalConfirmButton.click();
    await monitoringView.wait(until.not(until.presenceOf(row)));
  });
});
