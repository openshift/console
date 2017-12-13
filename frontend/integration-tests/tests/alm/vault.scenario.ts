/* eslint-disable no-undef, no-unused-vars */

import { browser, $, element, ExpectedConditions as until, by } from 'protractor';

import { appHost, testName, checkLogs } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as appListView from '../../views/app-list.view';

describe('Interacting with the Vault OCS', () => {
  const vaultOperatorName = 'vault-operator';
  const vaultServiceResources = new Set(['EtcdCluster', 'Service', 'ConfigMap', 'Secret', 'Deployment', 'ReplicaSet', 'Pod']);
  const deleteRecoveryTime = 60000;

  beforeAll(() => {
    browser.get(appHost);
  });

  afterEach(() => {
    checkLogs();
  });

  it('can be enabled from the Open Cloud Catalog', async() => {
    await sidenavView.clickNavLink(['Applications', 'Open Cloud Catalog']);
    await catalogView.isLoaded();
    await catalogView.entryRowFor('Vault').element(by.buttonText('Enable')).click();
    await browser.wait(until.presenceOf(catalogView.enableModal), 3000);
    await browser.wait(until.presenceOf(catalogView.selectNamespaceRowFor(testName)), 5000);
    await catalogView.selectNamespaceRowFor(testName).click();
    await catalogView.enableModalConfirm();
    await catalogView.entryRowFor('Vault').$$('a').first().click();
    await catalogView.entryRowFor('etcd').$$('a').first().click();
    await browser.wait(until.visibilityOf(catalogView.detailedBreakdownFor('Vault')));
    await browser.wait(until.visibilityOf(catalogView.detailedBreakdownFor('etcd')));
    await browser.sleep(500);

    expect(catalogView.namespaceEnabledFor('Vault')(testName)).toBe(true);
    expect(catalogView.namespaceEnabledFor('etcd')(testName)).toBe(true);
  });

  it('creates Vault Operator `Deployment`', async() => {
    await browser.get(`${appHost}/ns/${testName}/deployments`);
    await crudView.isLoaded();
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(vaultOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(vaultOperatorName).isDisplayed()).toBe(true);
    expect(crudView.labelsForRow(vaultOperatorName).filter(l => l.getText().then(t => t === `alm-owner-name=${vaultOperatorName}`)).first()).toBeDefined();
    expect(crudView.labelsForRow(vaultOperatorName).filter(l => l.getText().then(t => t === `alm-owner-namespace=${testName}`)).first()).toBeDefined();
  });

  xit('recreates Vault Operator `Deployment` if manually deleted', async() => {
    await crudView.deleteRow('Deployment')(vaultOperatorName);
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(vaultOperatorName).$('a[title=pods]'), '0 of 1 pods'));
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(vaultOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(vaultOperatorName).isDisplayed()).toBe(true);
  }, deleteRecoveryTime);

  it('displays Vault OCS in "Available Applications" view for the namespace', async() => {
    await browser.get(`${appHost}/ns/${testName}/clusterserviceversion-v1s`);
    await appListView.isLoaded();
    await browser.sleep(500);

    expect(appListView.appTileFor('Vault').isDisplayed()).toBe(true);
  });

  it('displays metadata about Vault OCS in the "Overview" section', async() => {
    await appListView.viewDetailsFor('Vault');
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

  it('displays YAML editor for creating a new `VaultService` instance', async() => {
    await element(by.buttonText('Create Vault Service')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor-header').getText()).toEqual('Create VaultService');
  });

  it('displays new `VaultService` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName('example')));

    expect(crudView.rowFilters.count()).toEqual(0);
    expect(crudView.rowForName('example').getText()).toContain('VaultService');
  });

  it('displays metadata about the created `VaultService` in its "Overview" section', async() => {
    await crudView.rowForName('example').element(by.linkText('example')).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `VaultService`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor--buttons')));
    await $('.yaml-editor--buttons').element(by.buttonText('Save Changes')).click();
    await browser.wait(until.visibilityOf($('.co-m-message--success')), 1000);

    expect($('.co-m-message--success').getText()).toContain('example has been updated to version');
  });

  it('displays Kubernetes objects associated with the `VaultService` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await browser.wait(until.visibilityOf(crudView.rowFilters.first()), 3000);

    vaultServiceResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('creates an associated `EtcdCluster` instance for the `VaultService` instance', async() => {
    await crudView.rowFilterFor('EtcdCluster').click();
    await browser.wait(until.visibilityOf(crudView.rowForName('example-etcd')));

    expect(crudView.rowForName('example-etcd').getText()).toContain('EtcdCluster');
  });
});
