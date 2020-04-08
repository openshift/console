import { execSync } from 'child_process';
import { browser, $, element, ExpectedConditions as until, by } from 'protractor';
import * as _ from 'lodash';
import {
  appHost,
  checkErrors,
  checkLogs,
  retry,
  testName,
} from '@console/internal-integration-tests/protractor.conf';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as catalogView from '@console/internal-integration-tests/views/catalog.view';
import * as catalogPageView from '@console/internal-integration-tests/views/catalog-page.view';
import * as sidenavView from '@console/internal-integration-tests/views/sidenav.view';
import * as yamlView from '@console/internal-integration-tests/views/yaml.view';
import * as operatorView from '../views/operator.view';
import * as operatorHubView from '../views/operator-hub.view';

describe('Interacting with an `AllNamespaces` install mode Operator (Jaeger)', () => {
  const jaegerResources = new Set([
    'Deployment',
    'Service',
    'ReplicaSet',
    'Pod',
    'Secret',
    'ConfigMap',
  ]);
  const jaegerOperatorName = 'jaeger-operator';
  const jaegerName = 'my-jaeger';

  const catalogNamespace = _.get(browser.params, 'globalCatalogNamespace', 'openshift-marketplace');
  const jaegerTileID = `jaeger-console-e2e-${catalogNamespace}`;
  const globalOperatorsNamespace = _.get(
    browser.params,
    'globalOperatorsNamespace',
    'openshift-operators',
  );

  const catalogSource = {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'CatalogSource',
    metadata: { name: 'console-e2e', labels: { 'olm-visibility': 'visible' } },
    spec: {
      sourceType: 'grpc',
      image:
        'quay.io/operator-framework/upstream-community-operators@sha256:5ae28f6de8affdb2a2119565ea950a2a777280b159f03b6ddddf104740571e25',
      displayName: 'Console E2E Operators',
      publisher: 'Red Hat, Inc',
    },
  };

  beforeAll(async () => {
    execSync(
      `echo '${JSON.stringify(catalogSource)}' | kubectl create -n ${catalogNamespace} -f -`,
    );
    await new Promise((resolve) =>
      (function checkForPackages() {
        const output = execSync(`kubectl get packagemanifests -n ${testName} -o json`);
        if (
          JSON.parse(output.toString('utf-8')).items.find(
            (pkg) => pkg.status.catalogSource === catalogSource.metadata.name,
          )
        ) {
          resolve();
        } else {
          setTimeout(checkForPackages, 2000);
        }
      })(),
    );

    await browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Operators')));
    await sidenavView.clickNavLink(['Operators', 'OperatorHub']);
    await crudView.isLoaded();
  });

  afterAll(() => {
    [
      `kubectl delete catalogsource -n ${catalogNamespace} ${catalogSource.metadata.name}`,
      `kubectl delete subscription -n ${globalOperatorsNamespace} jaeger`,
      `kubectl delete clusterserviceversion -n ${globalOperatorsNamespace} jaeger-operator.v1.8.2`,
    ].forEach((cmd) => _.attempt(() => execSync(cmd)));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays subscription creation form for selected Operator', async () => {
    await catalogView.categoryTabsPresent();
    await catalogView.categoryTabs.get(0).click();
    await catalogPageView.clickFilterCheckbox('providerType-custom');
    await catalogPageView.catalogTileByID(jaegerTileID).click();
    await browser.wait(until.visibilityOf(operatorHubView.operatorModal));
    await operatorHubView.operatorModalInstallBtn.click();
    await operatorHubView.createSubscriptionFormLoaded();

    expect(operatorHubView.createSubscriptionFormName.getText()).toEqual('Jaeger Tracing');
  });

  it('selects all namespaces for Operator subscription', async () => {
    await browser.wait(until.visibilityOf(operatorHubView.createSubscriptionFormInstallMode));
    await operatorHubView.allNamespacesInstallMode.click();

    expect(operatorHubView.createSubscriptionError.isPresent()).toBe(false);
    expect(operatorHubView.createSubscriptionFormBtn.getAttribute('disabled')).toEqual(null);
  });

  it('displays Operator as subscribed in OperatorHub', async () => {
    await operatorHubView.createSubscriptionFormBtn.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('installState-installed');

    expect(catalogPageView.catalogTileByID(jaegerTileID).isDisplayed()).toBe(true);
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async () => {
    await retry(() => catalogPageView.catalogTileByID(jaegerTileID).click());
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(until.visibilityOf(operatorView.rowForOperator('Jaeger Tracing')), 60000);
  });

  it('creates Operator `Deployment`', async () => {
    await browser.get(`${appHost}/k8s/all-namespaces/deployments`);
    await crudView.isLoaded();
    await crudView.filterForName(jaegerOperatorName);
    await browser.wait(
      until.textToBePresentInElement(
        crudView.rowForName(jaegerOperatorName).$('a[title=pods]'),
        '1 of 1 pods',
      ),
      100000,
    );

    expect(crudView.rowForName(jaegerOperatorName).isDisplayed()).toBe(true);
  });

  it('displays metadata about Operator in the "Overview" section', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/clusterserviceversions`);
    await crudView.isLoaded();
    await operatorView.rowForOperator('Jaeger Tracing').click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-m-pane__details').isDisplayed()).toBe(true);
  });

  it('displays empty message in the "Jaeger" section', async () => {
    await element(by.linkText('Jaeger')).click();
    await crudView.isLoaded();

    expect(crudView.statusMessageTitle.getText()).toEqual('No Operands Found');
    expect(crudView.statusMessageDetail.getText()).toEqual(
      'Operands are declarative components used to define the behavior of the application.',
    );
  });

  it('displays YAML editor for creating a new `Jaeger` instance', async () => {
    await browser.wait(until.visibilityOf(element(by.buttonText('Create Jaeger'))));
    await retry(() => element(by.buttonText('Create Jaeger')).click());
    await yamlView.isLoaded();

    expect($('.co-create-operand__header').getText()).toContain('Create Jaeger');
  });

  it('displays new `Jaeger` that was created from YAML editor', async () => {
    await $('#save-changes').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(operatorView.operandLink(jaegerName)));

    const isDisplayed = retry(() => operatorView.operandKind('Jaeger').isDisplayed());
    expect(isDisplayed).toBe(true);
  });

  it('displays metadata about the created `Jaeger` in its "Overview" section', async () => {
    await retry(() => operatorView.operandLink(jaegerName).click());
    await browser.wait(until.presenceOf($('.loading-box__loaded')), 5000);

    expect($('.co-operand-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `Jaeger`', async () => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor__buttons')));
    await $('.yaml-editor__buttons')
      .element(by.buttonText('Save'))
      .click();
    await browser.wait(until.visibilityOf(crudView.successMessage), 2000);

    expect(crudView.successMessage.getText()).toContain(
      `${jaegerName} has been updated to version`,
    );
  });

  it('displays Kubernetes objects associated with the `Jaeger` in its "Resources" section', async () => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    await crudView.rowFiltersPresent();
    jaegerResources.forEach((kind) => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays button to uninstall the Operator', async () => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('providerType-custom');
    await catalogPageView.clickFilterCheckbox('installState-installed');
    await catalogPageView.catalogTileByID(jaegerTileID).click();
    await operatorHubView.operatorModalIsLoaded();

    expect(operatorHubView.operatorModalUninstallBtn.isDisplayed()).toBe(true);
  });

  it('uninstalls Operator from the cluster', async () => {
    await operatorHubView.operatorModalUninstallBtn.click();
    await browser.wait(until.visibilityOf($('.co-catalog-install-modal')));
    await element(by.cssContainingText('#confirm-action', 'Uninstall')).click();
    await crudView.isLoaded();
    await browser.wait(until.invisibilityOf(operatorView.rowForOperator('Jaeger Tracing')), 5000);

    expect(operatorView.rowForOperator('Jaeger Tracing').isPresent()).toBe(false);
  });
});
