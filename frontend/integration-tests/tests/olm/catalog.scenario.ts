import { execSync } from 'child_process';
import { browser, $, ExpectedConditions as until } from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as catalogView from '../../views/olm-catalog.view';
import * as sidenavView from '../../views/sidenav.view';

describe('Installing an Operator from a Catalog Source', () => {
  const openCloudServices = new Set(['etcd', 'Prometheus Operator']);
  const operatorGroupName = 'test-operatorgroup';

  beforeAll(async() => {
    const catalogSource = {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'CatalogSource',
      metadata: {name: 'console-e2e'},
      spec: {
        sourceType: 'grpc',
        image: 'quay.io/operator-framework/upstream-community-operators@sha256:5ae28f6de8affdb2a2119565ea950a2a777280b159f03b6ddddf104740571e25',
        displayName: 'Console E2E Operators',
        publisher: 'Red Hat, Inc',
      },
    };

    execSync(`echo '${JSON.stringify(catalogSource)}' | kubectl create -n ${testName} -f -`);
    await new Promise(resolve => (function checkForPackages() {
      const output = execSync(`kubectl get packagemanifests -n ${testName} -o json`);
      if (JSON.parse(output.toString('utf-8')).items.find(pkg => pkg.status.catalogSourceNamespace === testName)) {
        return resolve();
      }
      setTimeout(checkForPackages, 2000);
    })());

    const operatorGroup = {
      apiVersion: 'operators.coreos.com/v1',
      kind: 'OperatorGroup',
      metadata: {name: operatorGroupName},
      spec: {targetNamespaces: [testName]},
    };
    execSync(`echo '${JSON.stringify(operatorGroup)}' | kubectl create -n ${testName} -f -`);

    browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf($('.pf-c-nav')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(() => {
    execSync(`kubectl delete operatorgroup -n ${testName} ${operatorGroupName}`);
  });

  it('displays `Catalog` tab in navigation sidebar', async() => {
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Catalog')));

    expect(sidenavView.navSectionFor('Catalog').isDisplayed()).toBe(true);
  });

  it('displays Catalog Source with expected available packages', async() => {
    await sidenavView.clickNavLink(['Catalog', 'Operator Management']);
    await catalogView.clickTab('Operator Catalogs');
    await catalogView.isLoaded();

    openCloudServices.forEach(name => {
      expect(catalogView.entryRowFor(name).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a subscription to an Operator', async() => {
    await catalogView.createSubscriptionFor('Prometheus');
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor__header').getText()).toContain('Create Subscription');
  });
});
