/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, element, ExpectedConditions as until, by } from 'protractor';
import { safeDump, safeLoad } from 'js-yaml';
import { defaultsDeep } from 'lodash';

import { appHost, testName, checkLogs, checkErrors } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as yamlView from '../../views/yaml.view';

describe('Interacting with the etcd OCS', () => {
  const etcdClusterResources = new Set(['Service', 'Pod']);
  const deleteRecoveryTime = 60000;
  const etcdOperatorName = 'etcd-operator';
  const testLabel = 'automatedTestName';
  const etcdcluster = `${testName}-etcdcluster`;
  const etcdbackup = `${testName}-etcdbackup`;
  const etcdrestore = `${testName}-etcdrestore`;

  beforeAll(async() => {
    browser.get(`${appHost}/status/all-namespaces`);
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Operators')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('can be enabled from the Catalog Sources', async() => {
    await sidenavView.clickNavLink(['Operators', 'Catalog Sources']);
    await catalogView.isLoaded();
    await catalogView.entryRowFor('etcd').element(by.buttonText('Create Subscription')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));
    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {generateName: `${testName}-etcd-`, namespace: testName, labels: {[testLabel]: testName}}, spec: {channel: 'alpha', source: 'rh-operators', name: 'etcd'}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));
    await $('#save-changes').click();
    await crudView.isLoaded();
    await sidenavView.clickNavLink(['Operators', 'Catalog Sources']);
    await catalogView.isLoaded();

    expect(catalogView.hasSubscription('etcd')).toBe(true);
  });

  it('creates etcd Operator `Deployment`', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
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

  it('displays etcd OCS in "Cluster Service Versions" view for the namespace', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/clusterserviceversions`);
    await crudView.isLoaded();
    await browser.sleep(500);

    browser.wait(until.visibilityOf(crudView.rowForOperator('etcd')), 5000);
  });

  it('displays metadata about etcd OCS in the "Overview" section', async() => {
    await crudView.rowForOperator('etcd').$('.co-clusterserviceversion-logo').click();
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
    await $$('.dropdown').filter(btn => btn.getText().then(text => text.startsWith('Create New'))).first().click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('etcd Cluster')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {name: `${testName}-etcdcluster`, labels: {[testLabel]: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));

    expect($('.yaml-editor-header').getText()).toEqual('Create Etcd Cluster');
  });

  it('displays new `EtcdCluster` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName(etcdcluster)));

    expect(crudView.rowFilters.count()).toEqual(3);
    expect(crudView.rowForName(etcdcluster).getText()).toContain('EtcdCluster');
  });

  it('displays metadata about the created `EtcdCluster` in its "Overview" section', async() => {
    await crudView.rowForName(etcdcluster).element(by.linkText(etcdcluster)).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `EtcdCluster`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor--buttons')));
    await $('.yaml-editor--buttons').element(by.buttonText('Save Changes')).click();
    await browser.wait(until.visibilityOf($('.alert-success')), 2000);

    expect($('.alert-success').getText()).toContain(`${etcdcluster} has been updated to version`);
  });

  it('displays Kubernetes objects associated with the `EtcdCluster` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    etcdClusterResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a new `EtcdBackup` instance', async() => {
    await $$('.breadcrumb-link').get(0).click();
    await crudView.isLoaded();
    await $$('.dropdown').filter(btn => btn.getText().then(text => text.startsWith('Create New'))).first().click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('etcd Backup')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {name: `${testName}-etcdbackup`, labels: {[testLabel]: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));

    expect($('.yaml-editor-header').getText()).toEqual('Create Etcd Backup');
  });

  it('displays new `EtcdBackup` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName(etcdbackup)));

    expect(crudView.rowFilters.count()).toEqual(3);
    expect(crudView.rowForName(etcdbackup).getText()).toContain('EtcdBackup');
  });

  it('displays metadata about the created `EtcdBackup` in its "Overview" section', async() => {
    await crudView.rowForName(etcdbackup).element(by.linkText(etcdbackup)).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `EtcdBackup`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor--buttons')));
    await $('.yaml-editor--buttons').element(by.buttonText('Save Changes')).click();
    await browser.wait(until.visibilityOf($('.alert-success')), 2000);

    expect($('.alert-success').getText()).toContain(`${etcdbackup} has been updated to version`);
  });

  it('displays Kubernetes objects associated with the `EtcdBackup` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    etcdClusterResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a new `EtcdRestore` instance', async() => {
    await $$('.breadcrumb-link').get(0).click();
    await crudView.isLoaded();
    await $$('.dropdown').filter(btn => btn.getText().then(text => text.startsWith('Create New'))).first().click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('etcd Restore')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {name: `${testName}-etcdrestore`, labels: {[testLabel]: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));

    expect($('.yaml-editor-header').getText()).toEqual('Create Etcd Restore');
  });

  it('displays new `EtcdRestore` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName(etcdrestore)));

    expect(crudView.rowFilters.count()).toEqual(3);
    expect(crudView.rowForName(etcdrestore).getText()).toContain('EtcdRestore');
  });

  it('displays metadata about the created `EtcdRestore` in its "Overview" section', async() => {
    await crudView.rowForName(etcdrestore).element(by.linkText(etcdrestore)).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `EtcdRestore`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor--buttons')));
    await $('.yaml-editor--buttons').element(by.buttonText('Save Changes')).click();
    await browser.wait(until.visibilityOf($('.alert-success')), 2000);

    expect($('.alert-success').getText()).toContain(`${etcdrestore} has been updated to version`);
  });

  it('displays Kubernetes objects associated with the `EtcdRestore` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    etcdClusterResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });
});
