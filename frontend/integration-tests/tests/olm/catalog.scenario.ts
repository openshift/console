/* eslint-disable no-undef, no-unused-vars */

import { browser, by, $, ExpectedConditions as until } from 'protractor';

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

  it('displays available namespaces for service to be enabled in', async() => {
    await catalogView.entryRowFor('Prometheus Operator').element(by.buttonText('Create Subscription')).click();
    await browser.wait(until.presenceOf($('.ace_text-input')));

    expect($('.yaml-editor-header').getText()).toEqual('Create Subscription');
  });
});
