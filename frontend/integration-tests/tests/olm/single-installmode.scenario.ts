import { browser, $, $$, element, ExpectedConditions as until, by } from 'protractor';
import { execSync } from 'child_process';
import * as _ from 'lodash';

import { appHost, testName, checkLogs, checkErrors } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as catalogPageView from '../../views/catalog-page.view';
import * as operatorHubView from '../../views/operator-hub.view';
import * as sidenavView from '../../views/sidenav.view';

describe('Interacting with a `OwnNamespace` install mode Operator (Prometheus)', () => {
  const prometheusResources = new Set(['StatefulSet', 'Pod']);
  const alertmanagerResources = new Set(['StatefulSet', 'Pod']);
  const serviceMonitorResources = new Set(['Pod']);
  const deleteRecoveryTime = 60000;
  const prometheusOperatorName = 'prometheus-operator';

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
    execSync(`echo '${JSON.stringify(catalogSource)}' | kubectl create -n ${testName} -f -`);
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
      `kubectl delete catalogsource -n ${testName} ${catalogSource.metadata.name}`,
      `kubectl delete subscription -n ${testName} prometheus`,
      `kubectl delete clusterserviceversion -n ${testName} prometheusoperator.0.27.0`,
    ].forEach(cmd => _.attempt(() => execSync(cmd)));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays subscription creation form for selected Operator', async() => {
    await catalogView.categoryTabs.get(0).click();
    await catalogPageView.clickFilterCheckbox('providerType-custom');
    await catalogPageView.catalogTileFor('Prometheus Operator').click();
    await browser.wait(until.visibilityOf(operatorHubView.operatorModal));
    await operatorHubView.operatorModalInstallBtn.click();
    await operatorHubView.createSubscriptionFormLoaded();

    expect(operatorHubView.createSubscriptionFormName.getText()).toEqual('Prometheus Operator');
  });

  it('selects target namespace for Operator subscription', async() => {
    await browser.wait(until.visibilityOf(operatorHubView.createSubscriptionFormInstallMode));
    await operatorHubView.ownNamespaceInstallMode.click();
    await browser.wait(until.visibilityOf(operatorHubView.installNamespaceDropdownBtn));
    await operatorHubView.installNamespaceDropdownBtn.click();
    await operatorHubView.installNamespaceDropdownFilter(testName);
    await operatorHubView.installNamespaceDropdownSelect(testName).click();

    expect(operatorHubView.createSubscriptionError.isPresent()).toBe(false);
    expect(operatorHubView.createSubscriptionFormBtn.getAttribute('disabled')).toEqual(null);
  });

  it('displays Operator as subscribed in OperatorHub', async() => {
    await operatorHubView.createSubscriptionFormBtn.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('providerType-custom');
    await catalogPageView.clickFilterCheckbox('installState-installed');

    expect(catalogPageView.catalogTileFor('Prometheus Operator').isDisplayed()).toBe(true);
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async() => {
    await catalogPageView.catalogTileFor('Prometheus Operator').click();
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(until.visibilityOf(crudView.rowForOperator('Prometheus Operator')), 30000);
  });

  it('creates Prometheus Operator `Deployment`', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
    await crudView.isLoaded();
    await crudView.filterForName(prometheusOperatorName);
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(prometheusOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(prometheusOperatorName).isDisplayed()).toBe(true);
    expect(crudView.labelsForRow(prometheusOperatorName).filter(l => l.getText().then(t => t === `olm.owner=${prometheusOperatorName}`)).first()).toBeDefined();
    expect(crudView.labelsForRow(prometheusOperatorName).filter(l => l.getText().then(t => t === `olm.owner.namespace=${testName}`)).first()).toBeDefined();
  });

  xit('recreates Prometheus Operator `Deployment` if manually deleted', async() => {
    await crudView.deleteRow('Deployment')(prometheusOperatorName);
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(prometheusOperatorName).$('a[title=pods]'), '0 of 1 pods'));
    await browser.wait(until.textToBePresentInElement(crudView.rowForName(prometheusOperatorName).$('a[title=pods]'), '1 of 1 pods'));

    expect(crudView.rowForName(prometheusOperatorName).isDisplayed()).toBe(true);
  }, deleteRecoveryTime);

  it('displays metadata about Prometheus Operator in the "Overview" section', async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/clusterserviceversions`);
    await crudView.isLoaded();
    await crudView.rowForOperator('Prometheus Operator').$('.co-clusterserviceversion-logo').click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-m-pane__details').isDisplayed()).toBe(true);
  });

  it('displays empty message in the "All Instances" section', async() => {
    await element(by.linkText('All Instances')).click();
    await crudView.isLoaded();

    expect(crudView.rowFilterFor('Prometheus').isDisplayed()).toBe(true);
    expect(crudView.rowFilterFor('Alertmanager').isDisplayed()).toBe(true);
    expect(crudView.rowFilterFor('ServiceMonitor').isDisplayed()).toBe(true);
    expect(crudView.rowFilterFor('PrometheusRule').isDisplayed()).toBe(true);
    expect(crudView.statusMessageTitle.getText()).toEqual('No Application Resources Found');
    expect(crudView.statusMessageDetail.getText()).toEqual('Application resources are declarative components used to define the behavior of the application.');
  });

  it('displays YAML editor for creating a new `Prometheus` instance', async() => {
    await browser.wait(until.visibilityOf(element(by.buttonText('Create New'))));
    await element(by.buttonText('Create New')).click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('Prometheus')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.co-create-operand__header').getText()).toContain('Create Prometheus');
  });

  it('displays new `Prometheus` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName('example')));

    expect(crudView.rowForName('example').getText()).toContain('Prometheus');
  });

  it('displays metadata about the created `Prometheus` in its "Overview" section', async() => {
    await crudView.rowForName('example').element(by.linkText('example')).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `Prometheus`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor__buttons')));
    await $('.yaml-editor__buttons').element(by.buttonText('Save')).click();
    await browser.wait(until.visibilityOf(crudView.successMessage), 1000);

    expect(crudView.successMessage.getText()).toContain('example has been updated to version');
  });

  it('displays Kubernetes objects associated with the `Prometheus` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    prometheusResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a new `Alertmanager` instance', async() => {
    await $$('[data-test-id=breadcrumb-link-1]').click();
    await crudView.isLoaded();
    await element(by.linkText('All Instances')).click();
    await browser.wait(until.visibilityOf(element(by.buttonText('Create New'))));
    await element(by.buttonText('Create New')).click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('Alertmanager')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.co-create-operand__header').getText()).toContain('Create Alertmanager');
  });

  it('displays new `Alertmanager` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName('alertmanager-main')));

    expect(crudView.rowForName('alertmanager-main').getText()).toContain('Alertmanager');
  });

  it('displays metadata about the created `Alertmanager` in its "Overview" section', async() => {
    await crudView.rowForName('alertmanager-main').element(by.linkText('alertmanager-main')).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `Alertmanager`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor__buttons')));
    await $('.yaml-editor__buttons').element(by.buttonText('Save')).click();
    await browser.wait(until.visibilityOf(crudView.successMessage), 1000);

    expect(crudView.successMessage.getText()).toContain('alertmanager-main has been updated to version');
  });

  it('displays Kubernetes objects associated with the `Alertmanager` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    alertmanagerResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a new `ServiceMonitor` instance', async() => {
    await $$('[data-test-id=breadcrumb-link-1]').click();
    await crudView.isLoaded();
    await element(by.linkText('All Instances')).click();
    await browser.wait(until.visibilityOf(element(by.buttonText('Create New'))));
    await element(by.buttonText('Create New')).click();
    await browser.wait(until.visibilityOf($$('.dropdown-menu').first()), 1000);
    await $$('.dropdown-menu').first().element(by.linkText('Service Monitor')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')), 10000);

    expect($('.co-create-operand__header').getText()).toContain('Create Service Monitor');
  });

  it('displays new `ServiceMonitor` that was created from YAML editor', async() => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.rowForName('example')));

    expect(crudView.rowForName('example').getText()).toContain('ServiceMonitor');
  });

  it('displays metadata about the created `ServiceMonitor` in its "Overview" section', async() => {
    await crudView.rowForName('example').element(by.linkText('example')).click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-clusterserviceversion-resource-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `ServiceMonitor`', async() => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor__buttons')));
    await $('.yaml-editor__buttons').element(by.buttonText('Save')).click();
    await browser.wait(until.visibilityOf(crudView.successMessage), 1000);

    expect(crudView.successMessage.getText()).toContain('example has been updated to version');
  });

  it('displays Kubernetes objects associated with the `ServiceMonitor` in its "Resources" section', async() => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    serviceMonitorResources.forEach(kind => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays button to uninstall the Operator', async() => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('providerType-custom');
    await catalogPageView.clickFilterCheckbox('installState-installed');
    await catalogPageView.catalogTileFor('Prometheus Operator').click();
    await operatorHubView.operatorModalIsLoaded();

    expect(operatorHubView.operatorModalUninstallBtn.isDisplayed()).toBe(true);
  });

  it('uninstalls Operator from the cluster', async() => {
    await operatorHubView.operatorModalUninstallBtn.click();
    await browser.wait(until.visibilityOf($('.co-catalog-install-modal')));
    await element(by.cssContainingText('#confirm-action', 'Remove')).click();
    await crudView.isLoaded();

    expect(crudView.rowForOperator('Prometheus Operator').isPresent()).toBe(false);
  });
});
