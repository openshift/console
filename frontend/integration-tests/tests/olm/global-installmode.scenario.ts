/* eslint-disable no-undef, no-unused-vars */

import { browser, $, element, ExpectedConditions as until, by } from 'protractor';
import { safeDump, safeLoad } from 'js-yaml';
import { defaultsDeep } from 'lodash';
import { execSync } from 'child_process';

import { appHost, testName, checkLogs, checkErrors } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/olm-catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as yamlView from '../../views/yaml.view';

describe('Interacting with the Redis Operator (all-namespaces install mode)', () => {
  const redisClusterResources = new Set(['Service', 'StatefulSet', 'Pod']);
  const deleteRecoveryTime = 60000;
  const redisOperatorName = 'redis-enterprise-operator';
  const testLabel = 'automatedTestName';
  const redisEnterpriseCluster = `${testName}-redisenterprisecluster`;
  const operatorGroupName = 'test-global-operatorgroup';

  beforeAll(async() => {
    const operatorGroup = {
      apiVersion: 'operators.coreos.com/v1alpha2',
      kind: 'OperatorGroup',
      metadata: {name: operatorGroupName},
    };
    execSync(`echo '${JSON.stringify(operatorGroup)}' | kubectl create -n ${testName} -f -`);

    await browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Catalog')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(() => {
    execSync(`kubectl delete operatorgroup -n ${testName} ${operatorGroupName}`);
    execSync(`kubectl delete subscriptions -n ${testName} --all`);
    execSync(`kubectl delete clusterserviceversions -n ${testName} --all`);
  });

  it('can be enabled from the Catalog Source', async() => {
    await sidenavView.clickNavLink(['Catalog', 'Operator Management']);
    await catalogView.isLoaded();
    await catalogView.createSubscriptionFor('Redis Enterprise');
    await browser.wait(until.presenceOf($('.ace_text-input')));
    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {generateName: `${testName}-redis-`, namespace: testName, labels: {[testLabel]: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));
    await $('#save-changes').click();
    await crudView.isLoaded();
    await sidenavView.clickNavLink(['Catalog', 'Operator Management']);
    await catalogView.isLoaded();

    expect(catalogView.hasSubscription('Redis Enterprise')).toBe(true);
  });

  it('creates Redis Operator `Deployment`', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
    await crudView.isLoaded();
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(redisOperatorName).$('a[title=pods]'), '1 of 1 pods'), 100000);

    expect(crudView.rowForName(redisOperatorName).isDisplayed()).toBe(true);
  });

  xit('recreates Redis Operator `Deployment` if manually deleted', async() => {
    await crudView.deleteRow('Deployment')(redisOperatorName);
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(redisOperatorName).$('a[title=pods]'), '0 of 1 pods'));
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(redisOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(redisOperatorName).isDisplayed()).toBe(true);
  }, deleteRecoveryTime);

  it('displays Redis OCS in "Cluster Service Versions" view for the namespace', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/clusterserviceversions`);
    await crudView.isLoaded();
    await browser.sleep(500);

    await browser.wait(until.visibilityOf(crudView.rowForOperator('Redis Enterprise')), 5000);
  });

  it('displays metadata about Redids OCS in the "Overview" section', async() => {
    await crudView.rowForOperator('Redis Enterprise').$('.co-clusterserviceversion-logo').click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-m-pane__details').isDisplayed()).toBe(true);
  });

  it('displays empty message in the "Redis Enterprise Cluster" section', async() => {
    await element(by.linkText('Redis Enterprise Cluster')).click();
    await crudView.isLoaded();

    expect(crudView.statusMessageTitle.getText()).toEqual('No Application Resources Found');
    expect(crudView.statusMessageDetail.getText()).toEqual('Application resources are declarative components used to define the behavior of the application.');
  });

  it('displays YAML editor for creating a new `RedisEnterpriseCluster` instance', async() => {
    await browser.wait(until.visibilityOf(element(by.buttonText('Create Redis Enterprise Cluster'))));
    await element(by.buttonText('Create Redis Enterprise Cluster')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    const content = await yamlView.editorContent.getText();
    const newContent = defaultsDeep({}, {metadata: {name: `${testName}-redisenterprisecluster`, labels: {[testLabel]: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));

    expect($('.yaml-editor__header').getText()).toContain('Create Redis Enterprise Cluster');
  });

  it('displays new `RedisEnterpriseCluster` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName(redisEnterpriseCluster)));

    expect(crudView.rowForName(redisEnterpriseCluster).getText()).toContain('RedisEnterpriseCluster');
  });

  it('displays metadata about the created `RedisEnterpriseCluster` in its "Overview" section', async() => {
    await crudView.rowForName(redisEnterpriseCluster).element(by.linkText(redisEnterpriseCluster)).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `RedisEnterpriseCluster`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor__buttons')));
    await $('.yaml-editor__buttons').element(by.buttonText('Save')).click();
    await browser.wait(until.visibilityOf(crudView.successMessage), 2000);

    expect(crudView.successMessage.getText()).toContain(`${redisEnterpriseCluster} has been updated to version`);
  });

  it('displays Kubernetes objects associated with the `RedisEnterpriseCluster` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    redisClusterResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });
});
