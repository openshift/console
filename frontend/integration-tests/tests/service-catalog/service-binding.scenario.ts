/* eslint-disable no-undef, no-unused-vars */

import {execSync} from 'child_process';
import {browser, $, $$, ExpectedConditions as until} from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../../protractor.conf';
import * as srvCatalogView from '../../views/service-catalog.view';
import * as sidenavView from '../../views/sidenav.view';
import * as crudView from '../../views/crud.view';

describe('Test for Cluster Service Binding', () => {
  beforeAll(async() => {
    browser.get(`${appHost}/status/ns/${testName}`);
    await browser.wait(until.presenceOf($('.pf-c-nav')));
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('creates a new binding for new service instance `mysql-persistent`', async() => {
    await sidenavView.clickNavLink(['Service Catalog', 'Service Classes']);
    await crudView.isLoaded();

    // Filter by service class name to make sure it is on the first page of results.
    // Otherwise the tests fail since we do virtual scrolling and the element isn't found.
    await crudView.filterForName('MySQL');
    await srvCatalogView.cscLinksPresent();

    await srvCatalogView.linkForCSC('MySQL').click();
    await crudView.isLoaded();

    expect(srvCatalogView.createInstanceButton.isDisplayed()).toBe(true);
    await srvCatalogView.createInstanceButton.click();
    await srvCatalogView.createInstanceFormIsLoaded();

    // select test namespace, then submit create instance form
    await $('#dropdown-selectbox').click();
    await $$('.dropdown-menu').first().$(`#${testName}-Project-link`).click();
    await srvCatalogView.createButton.click();
    await crudView.isLoaded();

    expect(crudView.resourceTitle.getText()).toEqual('mysql-persistent');

    await crudView.navTabFor('Service Bindings').click();
    await crudView.isLoaded();
    await crudView.createYAMLButton.click(); // embedded Create Service Binding button
    await srvCatalogView.createBindingFormIsLoaded();
    expect(crudView.resourceTitle.getText()).toEqual('Create Service Binding');

    await srvCatalogView.createButton.click();
    await crudView.isLoaded();
    expect(crudView.resourceTitle.getText()).toEqual('mysql-persistent');

    execSync(`kubectl delete -n ${testName} servicebinding mysql-persistent`);
    execSync(`kubectl delete -n ${testName} serviceinstance mysql-persistent`);
  });
});
