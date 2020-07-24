import { execSync } from 'child_process';
import { browser, $, $$, element, ExpectedConditions as until, by } from 'protractor';
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
import * as operatorView from '../views/operator.view';
import * as operatorHubView from '../views/operator-hub.view';
import { click } from '@console/shared/src/test-utils/utils';
import { NAME_FIELD_ID, formFieldIsPresent } from '../views/descriptors.view';

describe('Interacting with a `OwnNamespace` install mode Operator (Prometheus)', () => {
  const prometheusResources = new Set(['StatefulSet', 'Pod']);
  const prometheusOperatorName = 'prometheus-operator';
  const customProviderUID = 'providerType-console-e-2-e-operators';
  const prometheusTileID = `prometheus-console-e2e-${testName}`;

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
    execSync(`echo '${JSON.stringify(catalogSource)}' | kubectl create -n ${testName} -f -`);
    await new Promise((resolve) =>
      (function checkForPackages() {
        const output = execSync(
          `kubectl get packagemanifests -n ${testName} --selector=catalog=console-e2e -o json`,
        );
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
      `kubectl delete catalogsource -n ${testName} ${catalogSource.metadata.name}`,
      `kubectl delete subscription -n ${testName} prometheus`,
      `kubectl delete clusterserviceversion -n ${testName} prometheusoperator.0.27.0`,
    ].forEach((cmd) => _.attempt(() => execSync(cmd)));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays subscription creation form for selected Operator', async () => {
    await catalogView.categoryTabsPresent();
    await catalogView.categoryTabs.get(0).click();
    await catalogPageView.clickFilterCheckbox(customProviderUID);
    await catalogPageView.catalogTileFor('Prometheus Operator').click();
    await browser.wait(until.visibilityOf(operatorHubView.operatorModal));
    await operatorHubView.operatorModalInstallBtn.click();
    await operatorHubView.createSubscriptionFormLoaded();

    expect(operatorHubView.createSubscriptionFormName.getText()).toEqual('Prometheus Operator');
  });

  it('selects target namespace for Operator subscription', async () => {
    await browser.wait(until.visibilityOf(operatorHubView.createSubscriptionFormInstallMode));
    await operatorHubView.ownNamespaceInstallMode.click();
    await browser.wait(until.visibilityOf(operatorHubView.installNamespaceDropdownBtn));
    await browser.wait(crudView.untilNoLoadersPresent);
    await operatorHubView.installNamespaceDropdownBtn.click();
    await operatorHubView.installNamespaceDropdownFilter(testName);
    await operatorHubView.installNamespaceDropdownSelect(testName).click();

    expect(operatorHubView.createSubscriptionError.isPresent()).toBe(false);
    expect(operatorHubView.createSubscriptionFormBtn.getAttribute('disabled')).toEqual(null);
  });

  it('displays Operator as subscribed in OperatorHub', async () => {
    await operatorHubView.createSubscriptionFormBtn.click();
    await operatorHubView.operatorInstallPageLoaded();
    await operatorHubView.viewInstalledOperatorsBtn.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox(customProviderUID);
    await catalogPageView.clickFilterCheckbox('installState-installed');

    expect(catalogPageView.catalogTileByID(prometheusTileID).isDisplayed()).toBe(true);
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async () => {
    await retry(() => catalogPageView.catalogTileByID(prometheusTileID).click());
    await operatorHubView.operatorModalIsLoaded();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(
      until.visibilityOf(operatorView.rowForOperator('Prometheus Operator')),
      60000,
    );
  });

  xit('creates Prometheus Operator `Deployment`', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
    await crudView.isLoaded();
    await crudView.filterForName(prometheusOperatorName);
    await browser.wait(
      until.textToBePresentInElement(
        crudView.rowForName(prometheusOperatorName).$('a[title=pods]'),
        '1 of 1 pods',
      ),
    );

    expect(crudView.rowForName(prometheusOperatorName).isDisplayed()).toBe(true);
    expect(
      crudView
        .labelsForRow(prometheusOperatorName)
        .filter((l) => l.getText().then((t) => t === `olm.owner=${prometheusOperatorName}`))
        .first(),
    ).toBeDefined();
    expect(
      crudView
        .labelsForRow(prometheusOperatorName)
        .filter((l) => l.getText().then((t) => t === `olm.owner.namespace=${testName}`))
        .first(),
    ).toBeDefined();
  });

  it('displays metadata about Prometheus Operator in the "Overview" section', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/clusterserviceversions`);
    await crudView.isLoaded();
    await operatorView.operatorNameLink('Prometheus Operator').click();
    await browser.wait(until.presenceOf($('.loading-box__loaded')));

    expect($('.co-m-pane__details').isDisplayed()).toBe(true);
  });

  it('displays empty message in the "All Instances" section', async () => {
    await element(by.linkText('All Instances')).click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(crudView.statusMessageTitle));

    expect(crudView.statusMessageTitle.getText()).toEqual('No Operands Found');
    expect(crudView.statusMessageDetail.getText()).toEqual(
      'Operands are declarative components used to define the behavior of the application.',
    );
  });

  it('displays form editor for creating a new `Prometheus` instance', async () => {
    await browser.wait(until.visibilityOf(element(by.buttonText('Create New'))));
    await element(by.buttonText('Create New')).click();
    await browser.wait(until.visibilityOf($$('.pf-c-dropdown__menu').first()));
    await $$('.pf-c-dropdown__menu')
      .first()
      .element(by.buttonText('Prometheus'))
      .click();
    await formFieldIsPresent(NAME_FIELD_ID);

    expect($('.co-create-operand__header').getText()).toContain('Create Prometheus');
  });

  it('displays new `Prometheus` that was created from form editor', async () => {
    await $('button[type="submit"]').click();
    await crudView.isLoaded();
    await browser.wait(until.visibilityOf(operatorView.operandLink('example')));

    const isDisplayed = retry(() => operatorView.operandKind('Prometheus').isDisplayed());
    expect(isDisplayed).toBe(true);
  });

  it('displays metadata about the created `Prometheus` in its "Overview" section', async () => {
    await retry(() => operatorView.operandLink('example').click());
    await browser.wait(until.presenceOf($('.loading-box__loaded')));

    expect($('.co-operand-details__section--info').isDisplayed()).toBe(true);
  });

  it('displays the raw YAML for the `Prometheus`', async () => {
    await element(by.linkText('YAML')).click();
    await browser.wait(until.presenceOf($('.yaml-editor__buttons')));
    await $('.yaml-editor__buttons')
      .element(by.buttonText('Save'))
      .click();
    await browser.wait(until.visibilityOf(crudView.successMessage));

    expect(crudView.successMessage.getText()).toContain('example has been updated to version');
  });

  xit('displays Kubernetes objects associated with the `Prometheus` in its "Resources" section', async () => {
    await element(by.linkText('Resources')).click();
    await crudView.isLoaded();

    await crudView.rowFiltersPresent();
    await click(crudView.rowFiltersButton);
    prometheusResources.forEach((kind) => {
      expect(crudView.rowFilterFor(kind).isDisplayed()).toBe(true);
    });
  });

  it('displays button to uninstall the Operator', async () => {
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox(customProviderUID);
    await catalogPageView.clickFilterCheckbox('installState-installed');
    await catalogPageView.catalogTileFor('Prometheus Operator').click();
    await operatorHubView.operatorModalIsLoaded();

    expect(operatorHubView.operatorModalUninstallBtn.isDisplayed()).toBe(true);
  });

  it('uninstalls Operator from the cluster', async () => {
    await operatorHubView.operatorModalUninstallBtn.click();
    await browser.wait(until.visibilityOf($('.co-catalog-install-modal')));
    await element(by.cssContainingText('#confirm-action', 'Uninstall')).click();
    await crudView.isLoaded();
    await browser.wait(until.invisibilityOf(operatorView.rowForOperator('Prometheus Operator')));

    expect(operatorView.rowForOperator('Prometheus Operator').isPresent()).toBe(false);
  });
});
