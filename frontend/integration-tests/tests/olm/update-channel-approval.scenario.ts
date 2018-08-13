/* eslint-disable no-undef, no-unused-vars */

import { browser, ExpectedConditions as until, $, by, element } from 'protractor';
import { defaultsDeep } from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';

import { checkErrors, checkLogs, appHost, testName } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as yamlView from '../../views/yaml.view';

describe('Manually approving an install plan', () => {
  const pkgName = 'etcd';
  const subName = `${testName}-${pkgName}-manual`;
  const startingCSV = 'etcdoperator.v0.9.0';
  const testLabel = 'automatedTestName';

  beforeAll(async() => {
    browser.get(`${appHost}/status/${testName}`);
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Operators')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('removes existing subscription if necessary', async() => {
    await sidenavView.clickNavLink(['Operators', 'Catalog Sources']);
    await catalogView.isLoaded();

    if (await catalogView.hasSubscription(pkgName)) {
      await catalogView.entryRowFor(pkgName).element(by.linkText('View subscription')).click();
      const existingSub = await crudView.resourceRows.first().$$('.co-m-resource-icon + a').first().getText();
      await crudView.deleteRow('Subscription')(existingSub);

      expect(crudView.rowForName(existingSub).isDisplayed()).toBe(false);
    }
  });

  it('creates a subscription with a `startingCSV` that is not latest and manual approval strategy', async() => {
    await sidenavView.clickNavLink(['Operators', 'Catalog Sources']);
    await catalogView.isLoaded();
    await catalogView.entryRowFor(pkgName).element(by.buttonText('Create Subscription')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));
    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {name: subName, namespace: testName, labels: {[testLabel]: testName}}, spec: {startingCSV, installPlanApproval: 'Manual'}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));
    await $('#save-changes').click();
    await crudView.isLoaded();
    await sidenavView.clickNavLink(['Operators', 'Catalog Sources']);
    await catalogView.isLoaded();

    expect(catalogView.hasSubscription(pkgName)).toBe(true);
  });

  it('does not create a cluster service version', async() => {
    await catalogView.entryRowFor(pkgName).element(by.linkText('View subscription')).click();
    await crudView.selectOptionFromGear(subName, 'View ClusterServiceVersion');

    expect($('.co-m-pane__body').getText()).toContain('404: Not Found');
  });

  it('displays "Upgrading" for the subscription and a link to the active install plan', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/subscriptions/${subName}`);
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
    await $('.co-m-resource-subscription + a').click();
    await crudView.isLoaded();

    expect(element(by.linkText('1 installed')).isDisplayed()).toBe(true);
    expect(element(by.linkText('1 installing')).isDisplayed()).toBe(true);
    expect(element(by.linkText(startingCSV)).isDisplayed()).toBe(true);
  });
});
