/* eslint-disable no-undef, no-unused-vars */

import { execSync } from 'child_process';
import { browser, $, ExpectedConditions as until } from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as catalogView from '../../views/olm-catalog.view';
import * as sidenavView from '../../views/sidenav.view';

describe('Installing a service from a Catalog Source', () => {
  const openCloudServices = new Set(['etcd', 'Prometheus Operator', 'AMQ Streams', 'Service Catalog', 'FederationV2']);

  beforeAll(async() => {
    const operatorGroup = {
      apiVersion: 'operators.coreos.com/v1alpha2',
      kind: 'OperatorGroup',
      metadata: {name: 'test-operatorgroup'},
      spec: {selector: {matchLabels: {'test-name': testName}}},
    };
    execSync(`echo '${JSON.stringify(operatorGroup)}' | kubectl create -n ${testName} -f -`);

    browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf($('.pf-c-nav')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays `Operators` tab in navigation sidebar', async() => {
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Operators')));

    expect(sidenavView.navSectionFor('Operators').isDisplayed()).toBe(true);
  });

  it('displays Catalog Source with expected available packages', async() => {
    await sidenavView.clickNavLink(['Operators', 'Package Manifests']);
    await catalogView.isLoaded();

    openCloudServices.forEach(name => {
      expect(catalogView.entryRowFor(name).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a subscription to a service', async() => {
    await catalogView.createSubscriptionFor('Prometheus');
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor__header').getText()).toEqual('Create Subscription');
  });
});
