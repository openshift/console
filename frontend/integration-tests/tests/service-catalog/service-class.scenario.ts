/* eslint-disable no-undef, no-unused-vars */

import {browser, $, $$, ExpectedConditions as until, by} from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as srvCatalogView from '../../views/service-catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as crudView from '../../views/crud.view';
import {execSync} from 'child_process';

describe('Test for Cluster Service Class', () => {
  beforeAll(async() => {
    browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf($('.pf-c-nav')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays `default` service plan for service class `MariaDB`', async() => {
    await sidenavView.clickNavLink(['Service Catalog', 'Service Classes']);
    await crudView.isLoaded();

    // Filter by service class name to make sure it is on the first page of results.
    // Otherwise the tests fail since we do virtual scrolling and the element isn't found.
    await crudView.filterForName('MariaDB');
    await srvCatalogView.cscLinksPresent();

    await srvCatalogView.linkForCSC('MariaDB').click();
    await crudView.isLoaded();

    await crudView.navTabFor('Service Plans').click();
    await crudView.isLoaded();

    await crudView.rowForName('default').element(by.linkText('default')).click();
    await crudView.isLoaded();

    expect(crudView.resourceTitle.getText()).toEqual('default');
  });

  it('creates a new instance for service class `MariaDB`', async() => {
    await sidenavView.clickNavLink(['Service Catalog', 'Service Classes']);
    await crudView.isLoaded();

    // Filter by service class name to make sure it is on the first page of results.
    // Otherwise the tests fail since we do virtual scrolling and the element isn't found.
    await crudView.filterForName('MariaDB');
    await srvCatalogView.cscLinksPresent();
    expect(srvCatalogView.linkForCSC('MariaDB').isPresent()).toBe(true);

    await srvCatalogView.linkForCSC('MariaDB').click();
    await crudView.isLoaded();

    expect(srvCatalogView.createInstanceButton.isDisplayed()).toBe(true);
    await srvCatalogView.createInstanceButton.click();
    await srvCatalogView.createInstanceFormIsLoaded();

    // select test namespace, then submit form
    await $('#dropdown-selectbox').click();
    await $$('.dropdown-menu').first().$(`#${testName}-Project-link`).click();
    await srvCatalogView.createButton.click();
    await crudView.isLoaded();

    expect(crudView.resourceTitle.getText()).toEqual('mariadb-persistent');

    execSync(`kubectl delete -n ${testName} serviceinstance mariadb-persistent`);
  });
});
