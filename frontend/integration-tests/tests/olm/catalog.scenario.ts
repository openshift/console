/* eslint-disable no-undef, no-unused-vars */

import { browser, $, ExpectedConditions as until } from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';

describe('Installing a service from the Catalog Sources', () => {
  const openCloudServices = new Set(['etcd', 'Prometheus Operator']);

  beforeAll(async() => {
    browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf($('#sidebar')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays `Operators` tab in navigation sidebar', async() => {
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Operators')));

    expect(sidenavView.navSectionFor('Operators').isDisplayed()).toBe(true);
  });

  it('displays Catalog Sources with expected available services', async() => {
    await sidenavView.clickNavLink(['Operators', 'Catalog Sources']);
    await catalogView.isLoaded();

    openCloudServices.forEach(name => {
      expect(catalogView.entryRowFor(name).isDisplayed()).toBe(true);
    });
  });

  it('displays YAML editor for creating a subscription to a service', async() => {
    await catalogView.createSubscriptionFor('Prometheus Operator');
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor-header').getText()).toEqual('Create Subscription');
  });
});
