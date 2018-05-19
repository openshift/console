/* eslint-disable no-undef, no-unused-vars */

import { browser, ExpectedConditions as until, $, $$, by, element } from 'protractor';
import { defaultsDeep } from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';

import { checkErrors, checkLogs, appHost, testName } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as appListView from '../../views/app-list.view';
import * as yamlView from '../../views/yaml.view';

describe('Manually approving an install plan', () => {
  const startingCSV = 'etcdoperator.v0.9.0';
  const testLabel = 'automatedTestName';
  const BROWSER_TIMEOUT = 15000;
  const testNamespace = `${testName}-olm-update`;

  beforeAll(async() => {
    browser.get(`${appHost}/overview/all-namespaces`);
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Applications')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it(`creates test namespace ${testNamespace} if necessary`, async() => {
    await browser.get(`${appHost}/k8s/cluster/namespaces`);
    await crudView.isLoaded();
    const exists = await crudView.rowForName(testNamespace).isPresent();
    if (!exists) {
      await crudView.createYAMLButton.click();
      await browser.wait(until.presenceOf($('.modal-body__field')));
      await $$('.modal-body__field').get(0).$('input').sendKeys(testNamespace);
      await $('.modal-content').$('#confirm-delete').click();
      await browser.wait(until.urlContains(`/namespaces/${testNamespace}`), BROWSER_TIMEOUT);
    }

    expect(browser.getCurrentUrl()).toContain(appHost);
  });

  it('creates a subscription with a `startingCSV` that is not latest and manual approval strategy', async() => {
    await sidenavView.clickNavLink(['Applications', 'Open Cloud Catalog']);
    await catalogView.isLoaded();
    await catalogView.entryRowFor('etcd').element(by.buttonText('Subscribe')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));
    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {generateName: `${testName}-etcd-`, namespace: testNamespace, labels: {[testLabel]: testName}}, spec: {startingCSV, installPlanApproval: 'Manual'}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));
    await $('#save-changes').click();
    await crudView.isLoaded();
    await sidenavView.clickNavLink(['Applications', 'Open Cloud Catalog']);
    await catalogView.isLoaded();

    expect(catalogView.hasSubscription('etcd')).toBe(true);
  });

  it('displays "Upgrading" for the subscription and a link to the active install plan', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/clusterserviceversion-v1s`);
    await appListView.isLoaded();
    await browser.wait(until.visibilityOf(appListView.appTileFor('etcd')), 5000);
    await appListView.viewDetailsFor('etcd');
    await crudView.isLoaded();

    expect($('.co-detail-table__section--last').isDisplayed()).toBe(true);
    expect($('.co-detail-table__section--last').getText()).toContain('Upgrading');
    expect(element(by.linkText('1 installing')).isDisplayed()).toBe(true);
  });

  it('displays button which approves the install plan when clicked', async() => {
    await element(by.linkText('1 installing')).click();
    await element(by.buttonText('Approve')).click();
  });

  it('displays the newly installed version', async() => {
    await $('.co-m-resource-subscription-v1 + a').click();
    await crudView.isLoaded();

    expect(element(by.linkText('1 installed')).isDisplayed()).toBe(true);
    expect(element(by.linkText('1 installing')).isDisplayed()).toBe(true);
    expect(element(by.linkText(startingCSV)).isDisplayed()).toBe(true);
  });

  it('displays controls for changing the approval strategy to automatic', () => {

  });

  it('automatically installs the next version without approval after changing approval strategy', () => {

  });
});
