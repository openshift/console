/* eslint-disable no-undef, no-unused-vars */

import { browser, by, $, ExpectedConditions as until } from 'protractor';

import { appHost, testName, checkLogs, checkErrors } from '../../protractor.conf';
import * as catalogView from '../../views/catalog.view';
import * as sidenavView from '../../views/sidenav.view';

describe('Installing a service from the Open Cloud Catalog', () => {
  const openCloudServices = new Set(['etcd', 'Prometheus', 'Prometheus']);

  beforeAll(async() => {
    browser.get(appHost);
    await browser.wait(until.presenceOf($('#logo')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays `Applications` tab in navigation sidebar', async() => {
    await browser.wait(until.presenceOf($('.cluster-overview-cell')));
    expect(sidenavView.navSectionFor('Applications').isDisplayed()).toBe(true);
  });

  it('displays Open Cloud Catalog with three available services', async() => {
    await sidenavView.clickNavLink(['Applications', 'Open Cloud Catalog']);
    await catalogView.isLoaded();

    openCloudServices.forEach(name => {
      expect(catalogView.entryRowFor(name).isDisplayed()).toBe(true);
    });
  });

  it('displays available namespaces for service to be enabled in', async() => {
    await catalogView.entryRowFor('Prometheus').element(by.buttonText('Enable')).click();
    await browser.wait(until.presenceOf(catalogView.enableModal), 3000);
    await catalogView.selectNamespaceRowFor(testName).click();

    expect(catalogView.selectNamespaceRowFor(testName).getText()).toContain('Will be enabled');
  });
});
