import { browser, ExpectedConditions as until, Key} from 'protractor';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as search from '../views/search.view';
import * as yamlView from '../views/yaml.view';

const BROWSER_TIMEOUT = 15000;
const WORKLOAD_NAME = `filter-${testName}`;
const WORKLOAD_LABEL = `lbl-filter=${testName}`;

describe('Filter', () => {

  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets`);
    await crudView.isLoaded();
    await crudView.createYAMLButton.click();
    await yamlView.isLoaded();
    const content = await yamlView.editorContent.getText();
    const newContent = _.defaultsDeep({}, {metadata: {name: WORKLOAD_NAME, labels: {['lbl-filter']: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));
    await crudView.saveChangesBtn.click();
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

  // Scenario: Filter Pod from object detail
  // Given I log in into the console if it's required
  //   And I select the namespace "default"
  //   And I create a daemon set called "example"
  //   And I go to the daemon sets list page
  //   And I type "example" in the filter
  //   And I go to the detail on the daemonset "example"
  //   And I go to Pods tabdropdownLinks
  //  When I type "example" in the filter
  //  Then I expect to see one pod whose name starts with "example" listed in the results
  it('Filter Pod from object detail', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets`);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);

    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets/${WORKLOAD_NAME}/pods`);
    await browser.wait(until.elementToBeClickable(crudView.nameFilter), BROWSER_TIMEOUT);
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
  });

  // Scenario: Filter invalid Pod from object detail
  // Given I log in into the console if it's required
  //   And I select the namespace "default"
  //   And I create a daemon set called "example"
  //   And I go to the daemon sets list pageprotractor
  //   And I type "example" in the filter
  //   And I go to the detail on the daemonset "example"
  //   And I go to Pods tab
  //  When I type "XYZ123" in the filter
  //  Then I expect to see the message "No Pods Found"
  it('Filter invalid Pod from object detail', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/daemonsets/${WORKLOAD_NAME}/pods`);
    await browser.wait(until.elementToBeClickable(crudView.nameFilter), BROWSER_TIMEOUT);
    await crudView.nameFilter.sendKeys('XYZ123');
    await browser.wait(until.elementToBeClickable(crudView.messageLbl), BROWSER_TIMEOUT);
    expect(crudView.messageLbl.isPresent()).toBe(true);
  });

  // Scenario: Filter Daemon set from other namespace
  // Given I log in into the console if it's required
  //   And I select the namespace "default"
  //   And I create a daemon set called "example"
  //   And I go to the daemon sets list page
  //  When I select the namespace "kube-system"
  //   And I type "example" in the filter
  //  Then I expect to see the message "No Daemon Sets Found"
  it('Filter Daemon set from other namespace', async() => {
    await browser.get(`${appHost}/k8s/ns/kube-system/daemonsets`);
    await browser.wait(until.elementToBeClickable(crudView.nameFilter), BROWSER_TIMEOUT);
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.messageLbl), BROWSER_TIMEOUT);
    expect(crudView.messageLbl.isPresent()).toBe(true);
  });

  // Scenario: Filter from Pods listcat chicken cosplay
  // Given I log in into the console if it's required
  //   And I select the namespace "deWORKLOAD_LABELfault"
  //   And I create a daemon set called "example"
  //   And I select the namespace "all namespaces"
  //   And I go to Pods page
  //  When I type "example" in the filter
  //  Then I expect to see one pod whose name starts with "example" listed in the results
  it('Filter from Pods list', async() => {
    await browser.get(`${appHost}/k8s/all-namespaces/pods`);
    await browser.wait(until.elementToBeClickable(crudView.nameFilter), BROWSER_TIMEOUT);
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
  });

  // Scenario: Search object by label
  // Given I log in into the console if it's required
  //   And I select the namespace "default"
  //   And I create a daemon set called "example"
  //   And I go to Search page
  //  When I select "Daemon Sets"
  //   And I type "app=nginx" in the label filter
  //  Then I expect to see one object listed in the results with a name that starts with "example"
  it('Search object by label', async() => {
    await browser.get(`${appHost}/search/ns/${testName}`);
    await browser.wait(until.elementToBeClickable(search.dropdown), BROWSER_TIMEOUT);
    await search.selectSearchType('Daemon Sets');
    await search.labelFilter.sendKeys(WORKLOAD_LABEL, Key.ENTER);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
  });

  // Scenario: Search pod by label and filtering by name
  // Given I log in into the console if it's required
  //   And I select the namespace "default"
  //   And I create a daemon set called "example"
  //   And I go to Search page
  //   And I select the namespace "all namespaces"
  //  When I select "Pods"
  //   And I type "example" in the name filter
  //   And I type "app=hello-openshift" in the label filter
  //  Then I expect to see one object WORKLOAD_LABELlisted in the results with a name that starts with "example"
  it('Search pod by label and filtering by name', async() => {
    await browser.get(`${appHost}/search/all-namespaces?kind=Pod`);
    await crudView.isLoaded();
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await search.labelFilter.sendKeys('app=hello-openshift', Key.ENTER);
    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
  });

  // Scenario: Search object by label using by other kind of workload
  // Given I log in into the console if it's required
  //   And I select the namespace "default"
  //   And I create a daemon set called "example"
  //   And I go to Search page
  //  When I select "Deployments"
  //   And I type "app=nginx" in the label filter
  //  Then I expect to see one object listed in the results with a name that starts with "example"
  it('Search object by label using by other kind of workload', async() => {
    await browser.get(`${appHost}/search/all-namespaces?kind=Deployment`);
    await crudView.isLoaded();
    await search.labelFilter.sendKeys(WORKLOAD_LABEL, Key.ENTER);
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);
    await browser.wait(until.elementToBeClickable(crudView.messageLbl), BROWSER_TIMEOUT);
    expect(crudView.messageLbl.isPresent()).toBe(true);
  });
});
