/* eslint-disable no-undef, no-unused-vars */

import {browser, $, ExpectedConditions as until, by} from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as srvCatalogView from '../../views/service-catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as crudView from '../../views/crud.view';

describe('Test for Cluster Service Broker', () => {
  beforeAll(async() => {
    browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf($('.pf-c-nav')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays `MariaDB` service class for `template-service-broker`', async() => {
    await sidenavView.clickNavLink(['Service Catalog', 'Service Brokers']);
    await crudView.isLoaded();

    await crudView.rowForName('template-service-broker').element(by.linkText('template-service-broker')).click();
    await crudView.isLoaded();

    await crudView.navTabFor('Service Classes').click();
    await crudView.isLoaded();

    await crudView.filterForName('MariaDB');
    await srvCatalogView.linkForCSC('MariaDB').click();
    await crudView.isLoaded();

    expect(crudView.resourceTitle.getText()).toEqual('MariaDB');
  });
});
