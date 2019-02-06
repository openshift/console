/* eslint-disable no-undef, no-unused-vars */

import { execSync } from 'child_process';
import { browser, $, ExpectedConditions as until } from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as catalogView from '../../views/olm-catalog.view';
import * as sidenavView from '../../views/sidenav.view';

describe('Installing a service from a Catalog Source', () => {
  const openCloudServices = new Set(['etcd', 'Prometheus Operator', 'AMQ Streams', 'Service Catalog', 'FederationV2']);
  const operatorGroupName = 'test-operatorgroup';

  beforeAll(async() => {
    const catalogSource = {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'CatalogSource',
      metadata: {name: 'console-e2e'},
      spec: {
        sourceType: 'grpc',
        image: 'quay.io/operatorframework/operator-manifests@sha256:ac3140d9f2d2a3cf5446d82048ddf64ad5cd13b31070d1c4b5c689b7272062dc',
        displayName: 'Console E2E Operators',
        publisher: 'Red Hat, Inc',
      },
    };
    execSync(`echo '${JSON.stringify(catalogSource)}' | kubectl create -n ${testName} -f -`);
    // FIXME(alecmerdler): Wait until `PackageManifests` are being served from registry pod
    browser.sleep(30000);

    const operatorGroup = {
      apiVersion: 'operators.coreos.com/v1alpha2',
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
    await catalogView.isLoaded();

    openCloudServices.forEach(name => {
      expect(catalogView.entryRowFor(name).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a subscription to a service', async() => {
    await catalogView.createSubscriptionFor('Prometheus');
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor__header').getText()).toContain('Create Subscription');
  });
});
