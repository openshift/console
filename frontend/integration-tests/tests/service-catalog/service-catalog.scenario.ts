/* eslint-disable no-undef, no-unused-vars */

import {browser, $, ExpectedConditions as until} from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as sidenavView from '../../views/sidenav.view';
import * as crudView from '../../views/crud.view';
import * as srvCatalogView from '../../views/service-catalog.view';

describe('Test for existence of Service Catalog nav items', () => {
  beforeAll(async() => {
    browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf($('.pf-c-nav')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays `Service Catalog` nav menu item in sidebar', async() => {
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Service Catalog')));

    expect(sidenavView.navSectionFor('Service Catalog').isDisplayed()).toBe(true);
  });

  it('displays `template-service-broker`', async() => {
    await sidenavView.clickNavLink(['Service Catalog', 'Service Brokers']);
    await crudView.isLoaded();

    expect(crudView.rowForName('template-service-broker').isDisplayed()).toBe(true);
  });

  it('displays `MariaDB` service class', async() => {
    await sidenavView.clickNavLink(['Service Catalog', 'Service Classes']);
    await crudView.isLoaded();

    await crudView.filterForName('MariaDB');
    await srvCatalogView.cscLinksPresent();

    expect(srvCatalogView.linkForCSC('MariaDB').isDisplayed()).toBe(true);
  });

  it('initially displays no service instances', async() => {
    await sidenavView.clickNavLink(['Service Catalog', 'Service Instances']);
    await crudView.isLoaded();

    expect(crudView.emptyState.getText()).toEqual('No Service Instances Found');
  });

  it('initially displays no service bindings', async() => {
    await sidenavView.clickNavLink(['Service Catalog', 'Service Bindings']);
    await crudView.isLoaded();

    expect(crudView.emptyState.getText()).toEqual('No Service Bindings Found');
  });
});
