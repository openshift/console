/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, element, ExpectedConditions as until, by } from 'protractor';
import { defaultsDeep } from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';

import { appHost, testName, checkLogs, checkErrors } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as yamlView from '../../views/yaml.view';

describe('Interacting with the Prometheus OCS', () => {
  const prometheusResources = new Set(['StatefulSet', 'Pod']);
  const alertmanagerResources = new Set(['StatefulSet', 'Pod']);
  const serviceMonitorResources = new Set(['Pod']);
  const deleteRecoveryTime = 60000;
  const prometheusOperatorName = 'prometheus-operator';
  const testLabel = 'automatedTestName';

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
    await catalogView.entryRowFor('Prometheus Operator').element(by.buttonText('Create Subscription')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));
    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {generateName: `${testName}-prometheus-`, namespace: testName, labels: {[testLabel]: testName}}, spec: {channel: 'alpha', source: 'rh-operators', name: 'prometheus'}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));
    await $('#save-changes').click();
    await crudView.isLoaded();
    await sidenavView.clickNavLink(['Operators', 'Catalog Sources']);
    await catalogView.isLoaded();

    expect(catalogView.hasSubscription('Prometheus Operator')).toBe(true);
  });

  it('creates Prometheus Operator `Deployment`', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
    await crudView.isLoaded();
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(prometheusOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(prometheusOperatorName).isDisplayed()).toBe(true);
    expect(crudView.labelsForRow(prometheusOperatorName).filter(l => l.getText().then(t => t === `alm-owner-name=${prometheusOperatorName}`)).first()).toBeDefined();
    expect(crudView.labelsForRow(prometheusOperatorName).filter(l => l.getText().then(t => t === `alm-owner-namespace=${testName}`)).first()).toBeDefined();
  });

  xit('recreates Prometheus Operator `Deployment` if manually deleted', async() => {
    await crudView.deleteRow('Deployment')(prometheusOperatorName);
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(prometheusOperatorName).$('a[title=pods]'), '0 of 1 pods'));
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(prometheusOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(prometheusOperatorName).isDisplayed()).toBe(true);
  }, deleteRecoveryTime);

  it('displays Prometheus OCS in "Cluster Service Versions" view for the namespace', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/clusterserviceversions`);
    await crudView.isLoaded();
    await browser.sleep(500);

    browser.wait(until.visibilityOf(crudView.rowForOperator('Prometheus Operator')), 5000);
  });

  it('displays metadata about Prometheus OCS in the "Overview" section', async() => {
    await crudView.rowForOperator('Prometheus Operator').$('.co-clusterserviceversion-logo').click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-details__section--info').isDisplayed()).toBe(true);
    expect($('.co-clusterserviceversion-details__section--description').isDisplayed()).toBe(true);
  });

  it('displays empty message in the "Instances" section', async() => {
    await element(by.linkText('Instances')).click();
    await crudView.isLoaded();

    expect(crudView.rowFilterFor('Prometheus').isDisplayed()).toBe(true);
    expect(crudView.rowFilterFor('Alertmanager').isDisplayed()).toBe(true);
    expect(crudView.rowFilterFor('ServiceMonitor').isDisplayed()).toBe(true);
    expect(crudView.statusMessageTitle.getText()).toEqual('No Application Resources Found');
    expect(crudView.statusMessageDetail.getText()).toEqual('Application resources are declarative components used to define the behavior of the application.');
  });

  it('displays YAML editor for creating a new `Prometheus` instance', async() => {
    await $$('.dropdown').filter(btn => btn.getText().then(text => text.startsWith('Create New'))).first().click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('Prometheus')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor-header').getText()).toEqual('Create Prometheus');
  });

  it('displays new `Prometheus` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName('example')));

    expect(crudView.rowFilterFor('Prometheus').$('.row-filter--number-bubble').getText()).toEqual('1');
  });

  it('displays metadata about the created `Prometheus` in its "Overview" section', async() => {
    await crudView.rowForName('example').element(by.linkText('example')).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `Prometheus`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor--buttons')));
    await $('.yaml-editor--buttons').element(by.buttonText('Save Changes')).click();
    await browser.wait(until.visibilityOf($('.alert-success')), 1000);

    expect($('.alert-success').getText()).toContain('example has been updated to version');
  });

  it('displays Kubernetes objects associated with the `Prometheus` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    prometheusResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a new `Alertmanager` instance', async() => {
    await $$('.breadcrumb-link').first().click();
    await crudView.isLoaded();
    await $$('.dropdown').filter(btn => btn.getText().then(text => text.startsWith('Create New'))).first().click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('Alertmanager')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor-header').getText()).toEqual('Create Alertmanager');
  });

  it('displays new `Alertmanager` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName('alertmanager-main')));

    expect(crudView.rowFilterFor('Alertmanager').$('.row-filter--number-bubble').getText()).toEqual('1');
    expect(crudView.rowForName('alertmanager-main').getText()).toContain('Alertmanager');
  });

  it('displays metadata about the created `Alertmanager` in its "Overview" section', async() => {
    await crudView.rowForName('alertmanager-main').element(by.linkText('alertmanager-main')).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `Alertmanager`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor--buttons')));
    await $('.yaml-editor--buttons').element(by.buttonText('Save Changes')).click();
    await browser.wait(until.visibilityOf($('.alert-success')), 1000);

    expect($('.alert-success').getText()).toContain('alertmanager-main has been updated to version');
  });

  it('displays Kubernetes objects associated with the `Alertmanager` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    alertmanagerResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a new `ServiceMonitor` instance', async() => {
    await $$('.breadcrumb-link').first().click();
    await crudView.isLoaded();
    await $$('.dropdown').filter(btn => btn.getText().then(text => text.startsWith('Create New'))).first().click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('Service Monitor')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')), 10000);

    expect($('.yaml-editor-header').getText()).toEqual('Create Service Monitor');
  });

  it('displays new `ServiceMonitor` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName('example')));

    expect(crudView.rowFilterFor('ServiceMonitor').$('.row-filter--number-bubble').getText()).toEqual('1');
  });

  it('displays metadata about the created `ServiceMonitor` in its "Overview" section', async() => {
    await crudView.rowForName('example').element(by.linkText('example')).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `ServiceMonitor`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor--buttons')));
    await $('.yaml-editor--buttons').element(by.buttonText('Save Changes')).click();
    await browser.wait(until.visibilityOf($('.alert-success')), 1000);

    expect($('.alert-success').getText()).toContain('example has been updated to version');
  });

  it('displays Kubernetes objects associated with the `ServiceMonitor` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    serviceMonitorResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });
});
