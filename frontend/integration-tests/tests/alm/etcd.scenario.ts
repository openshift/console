/* eslint-disable no-undef, no-unused-vars */

import { browser, $, element, ExpectedConditions as until, by } from 'protractor';

import { appHost, testName, checkLogs } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as appListView from '../../views/app-list.view';

describe('Interacting with the etcd OCS', () => {
  const etcdClusterResources = new Set(['Service', 'Pod']);
  const deleteRecoveryTime = 60000;
  const etcdOperatorName = 'etcd-operator';

  beforeAll(() => {
    browser.get(appHost);
  });

  afterEach(() => {
    checkLogs();
  });

  it('can be enabled from the Open Cloud Catalog', async() => {
    await sidenavView.clickNavLink(['Applications', 'Open Cloud Catalog']);
    await catalogView.isLoaded();
    await catalogView.entryRowFor('etcd').element(by.buttonText('Enable')).click();
    await browser.wait(until.presenceOf(catalogView.enableModal), 3000);
    await browser.wait(until.presenceOf(catalogView.selectNamespaceRowFor(testName)), 5000);
    await catalogView.selectNamespaceRowFor(testName).click();
    await catalogView.enableModalConfirm();
    await catalogView.entryRowFor('etcd').$$('a').first().click();
    await browser.wait(until.visibilityOf(catalogView.detailedBreakdownFor('etcd')), 1000);
    await browser.sleep(1000);

    expect(catalogView.namespaceEnabledFor('etcd')(testName)).toBe(true);
  });

  it('creates etcd Operator `Deployment`', async() => {
    await browser.get(`${appHost}/ns/${testName}/deployments`);
    await crudView.isLoaded();
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(etcdOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(etcdOperatorName).isDisplayed()).toBe(true);
    expect(crudView.labelsForRow(etcdOperatorName).filter(l => l.getText().then(t => t === `alm-owner-name=${etcdOperatorName}`)).first()).toBeDefined();
    expect(crudView.labelsForRow(etcdOperatorName).filter(l => l.getText().then(t => t === `alm-owner-namespace=${testName}`)).first()).toBeDefined();
  });

  xit('recreates etcd Operator `Deployment` if manually deleted', async() => {
    await crudView.deleteRow('Deployment')(etcdOperatorName);
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(etcdOperatorName).$('a[title=pods]'), '0 of 1 pods'));
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(etcdOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(etcdOperatorName).isDisplayed()).toBe(true);
  }, deleteRecoveryTime);

  it('displays etcd OCS in "Available Applications" view for the namespace', async() => {
    await browser.get(`${appHost}/ns/${testName}/applications`);
    await appListView.isLoaded();
    await browser.sleep(500);

    expect(appListView.appTileFor('etcd').isDisplayed()).toBe(true);
  });

  it('displays metadata about etcd OCS in the "Overview" section', async() => {
    await appListView.viewDetailsFor('etcd');
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-details__section--info').isDisplayed()).toBe(true);
    expect($('.co-clusterserviceversion-details__section--description').isDisplayed()).toBe(true);
  });

  it('displays empty message in the "Instances" section', async() => {
    await element(by.linkText('Instances')).click();
    await crudView.isLoaded();

    expect(crudView.statusMessageTitle.getText()).toEqual('No Application Resources Found');
    expect(crudView.statusMessageDetail.getText()).toEqual('Application resources are declarative components used to define the behavior of the application.');
  });

  it('displays YAML editor for creating a new `EtcdCluster` instance', async() => {
    await element(by.buttonText('Create etcd Cluster')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor-header').getText()).toEqual('Create etcd Cluster');
  });

  it('displays new `EtcdCluster` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName('example')));

    expect(crudView.rowFilters.count()).toEqual(0);
    expect(crudView.rowForName('example').getText()).toContain('EtcdCluster');
  });

  it('displays metadata about the created `EtcdCluster` in its "Overview" section', async() => {
    await crudView.rowForName('example').element(by.linkText('example')).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `EtcdCluster`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor--buttons')));
    await $('.yaml-editor--buttons').element(by.buttonText('Save Changes')).click();
    await browser.wait(until.visibilityOf($('.co-m-message--success')), 2000);

    expect($('.co-m-message--success').getText()).toContain('example has been updated to version');
  });

  it('displays Kubernetes objects associated with the `EtcdCluster` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    etcdClusterResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });
});
