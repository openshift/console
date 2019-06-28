import { browser, $, element, ExpectedConditions as until, by } from 'protractor';
import { safeDump, safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import { execSync } from 'child_process';

import { appHost, testName, checkLogs, checkErrors } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as catalogPageView from '../../views/catalog-page.view';
import * as operatorHubView from '../../views/operator-hub.view';
import * as sidenavView from '../../views/sidenav.view';
import * as yamlView from '../../views/yaml.view';

describe('Interacting with an `AllNamespaces` install mode Operator (Redis)', () => {
  const redisClusterResources = new Set(['Service', 'StatefulSet', 'Pod']);
  const deleteRecoveryTime = 60000;
  const redisOperatorName = 'redis-enterprise-operator';
  const testLabel = 'automatedTestName';
  const redisEnterpriseCluster = `${testName}-redisenterprisecluster`;

  const catalogNamespace = _.get(browser.params, 'globalCatalogNamespace', 'openshift-marketplace');
  const globalOperatorsNamespace = _.get(browser.params, 'globalOperatorsNamespace', 'openshift-operators');

  const catalogSource = {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'CatalogSource',
    metadata: {name: 'console-e2e', labels: {'olm-visibility': 'visible'}},
    spec: {
      sourceType: 'grpc',
      image: 'quay.io/operator-framework/upstream-community-operators@sha256:5ae28f6de8affdb2a2119565ea950a2a777280b159f03b6ddddf104740571e25',
      displayName: 'Console E2E Operators',
      publisher: 'Red Hat, Inc',
    },
  };

  beforeAll(async() => {
    execSync(`echo '${JSON.stringify(catalogSource)}' | kubectl create -n ${catalogNamespace} -f -`);
    await new Promise(resolve => (function checkForPackages() {
      const output = execSync(`kubectl get packagemanifests -n ${testName} -o json`);
      if (JSON.parse(output.toString('utf-8')).items.find(pkg => pkg.status.catalogSource === catalogSource.metadata.name)) {
        return resolve();
      }
      setTimeout(checkForPackages, 2000);
    })());

    await browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Catalog')));
    await sidenavView.clickNavLink(['Catalog', 'OperatorHub']);
    await crudView.isLoaded();
  });

  afterAll(() => {
    [
      `kubectl delete catalogsource -n ${catalogNamespace} ${catalogSource.metadata.name}`,
      `kubectl delete subscription -n ${globalOperatorsNamespace} redis-enterprise`,
      `kubectl delete clusterserviceversion -n ${globalOperatorsNamespace} redis-enterprise-operator.v0.0.1`,
    ].forEach(cmd => _.attempt(() => execSync(cmd)));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays subscription creation form for selected Operator', async() => {
    await catalogView.categoryTabs.get(0).click();
    await catalogPageView.clickFilterCheckbox('providerType-custom');
    await catalogPageView.catalogTileFor('Redis Enterprise').click();
    await browser.wait(until.visibilityOf(operatorHubView.operatorModal));
    await operatorHubView.operatorModalInstallBtn.click();
    await operatorHubView.createSubscriptionFormLoaded();

    expect(operatorHubView.createSubscriptionFormName.getText()).toEqual('Redis Enterprise');
  });

  it('selects all namespaces for Operator subscription', async() => {
    await browser.wait(until.visibilityOf(operatorHubView.createSubscriptionFormInstallMode));
    await operatorHubView.allNamespacesInstallMode.click();

    expect(operatorHubView.createSubscriptionError.isPresent()).toBe(false);
    expect(operatorHubView.createSubscriptionFormBtn.getAttribute('disabled')).toEqual(null);
  });

  it('displays Operator as subscribed in OperatorHub', async() => {
    await operatorHubView.createSubscriptionFormBtn.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('installState-installed');

    expect(catalogPageView.catalogTileFor('Redis Enterprise').isDisplayed()).toBe(true);
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async() => {
    await catalogPageView.catalogTileFor('Redis Enterprise').click();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(until.visibilityOf(crudView.rowForOperator('Redis Enterprise')), 30000);
  });

  it('creates Redis Operator `Deployment`', async() => {
    await browser.get(`${appHost}/k8s/all-namespaces/deployments`);
    await crudView.isLoaded();
    await crudView.filterForName(redisOperatorName);
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(redisOperatorName).$('a[title=pods]'), '1 of 1 pods'), 100000);

    expect(crudView.rowForName(redisOperatorName).isDisplayed()).toBe(true);
  });

  xit('recreates Redis Operator `Deployment` if manually deleted', async() => {
    await crudView.deleteRow('Deployment')(redisOperatorName);
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(redisOperatorName).$('a[title=pods]'), '0 of 1 pods'));
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(redisOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(redisOperatorName).isDisplayed()).toBe(true);
  }, deleteRecoveryTime);

  it('displays metadata about Redis Operator in the "Overview" section', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/clusterserviceversions`);
    await crudView.isLoaded();
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
    const newContent = _.defaultsDeep({}, {metadata: {name: `${testName}-redisenterprisecluster`, labels: {[testLabel]: testName}}}, safeLoad(content));
    await yamlView.setContent(safeDump(newContent));

    expect($('.co-create-operand__header').getText()).toContain('Create Redis Enterprise Cluster');
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

  it('displays button to uninstall the Operator', async() => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('providerType-custom');
    await catalogPageView.clickFilterCheckbox('installState-installed');
    await catalogPageView.catalogTileFor('Redis Enterprise').click();
    await operatorHubView.operatorModalIsLoaded();

    expect(operatorHubView.operatorModalUninstallBtn.isDisplayed()).toBe(true);
  });

  it('uninstalls Operator from the cluster', async() => {
    await operatorHubView.operatorModalUninstallBtn.click();
    await browser.wait(until.visibilityOf($('.co-catalog-install-modal')));
    await element(by.cssContainingText('#confirm-action', 'Remove')).click();
    await crudView.isLoaded();

    expect(crudView.rowForOperator('Redis Enterprise').isPresent()).toBe(false);
  });
});
