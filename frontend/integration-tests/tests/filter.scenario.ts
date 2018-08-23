import { browser, ExpectedConditions as until, Key } from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as searchView from '../views/search.view';
import * as yamlView from '../views/yaml.view';

const BROWSER_TIMEOUT = 15000;
const WORKLOAD_NAME = `filter-${testName}`;
const WORKLOAD_LABEL = `lbl-filter=${testName}`;

describe('Filtering', () => {

  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets`);
    await crudView.isLoaded();
    await crudView.createYAMLButton.click();
    await yamlView.isLoaded();
    const content = await yamlView.editorContent.getText();
    const newContent = _.defaultsDeep({}, {metadata: {name: WORKLOAD_NAME, labels: {['lbl-filter']: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));
    await crudView.saveChangesBtn.click();
    // Wait until the resource is created and the details page loads before continuing.
    await browser.wait(until.presenceOf(crudView.actionsDropdown));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets`);
    await crudView.isLoaded();
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    await crudView.deleteRow('daemonset')(WORKLOAD_NAME);
  });

  it('filters Pod from object detail', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets`);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);

    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets/${WORKLOAD_NAME}/pods`);
    await browser.wait(until.elementToBeClickable(crudView.nameFilter), BROWSER_TIMEOUT);
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
  });

  it('filters invalid Pod from object detail', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets/${WORKLOAD_NAME}/pods`);
    await browser.wait(until.elementToBeClickable(crudView.nameFilter), BROWSER_TIMEOUT);
    await crudView.nameFilter.sendKeys('XYZ123');
    await browser.wait(until.elementToBeClickable(crudView.messageLbl), BROWSER_TIMEOUT);
    expect(crudView.messageLbl.isPresent()).toBe(true);
  });

  it('filters DaemonSet from other namespace', async() => {
    await browser.get(`${appHost}/k8s/ns/kube-system/daemonsets`);
    await browser.wait(until.elementToBeClickable(crudView.nameFilter), BROWSER_TIMEOUT);
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.messageLbl), BROWSER_TIMEOUT);
    expect(crudView.messageLbl.isPresent()).toBe(true);
  });

  it('filters from Pods list', async() => {
    await browser.get(`${appHost}/k8s/all-namespaces/pods`);
    await browser.wait(until.elementToBeClickable(crudView.nameFilter), BROWSER_TIMEOUT);
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
  });

  it('searches for object by label', async() => {
    await browser.get(`${appHost}/search/ns/${testName}`);
    await browser.wait(until.elementToBeClickable(searchView.dropdown), BROWSER_TIMEOUT);
    await searchView.selectSearchType('DaemonSet');
    await searchView.labelFilter.sendKeys(WORKLOAD_LABEL, Key.ENTER);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
  });

  it('searches for pod by label and filtering by name', async() => {
    await browser.get(`${appHost}/search/all-namespaces?kind=Pod`);
    await crudView.isLoaded();
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await searchView.labelFilter.sendKeys('app=hello-openshift', Key.ENTER);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
  });

  it('searches for object by label using by other kind of workload', async() => {
    await browser.get(`${appHost}/search/all-namespaces?kind=Deployment`);
    await crudView.isLoaded();
    await searchView.labelFilter.sendKeys(WORKLOAD_LABEL, Key.ENTER);
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.messageLbl), BROWSER_TIMEOUT);
    expect(crudView.messageLbl.isPresent()).toBe(true);
  });
});
