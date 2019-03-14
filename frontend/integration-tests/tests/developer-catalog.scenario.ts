/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, ExpectedConditions as until } from 'protractor';
import { execSync } from 'child_process';

import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as catalogView from '../views/catalog.view';
import * as catalogPageView from '../views/catalog-page.view';
import * as srvCatalogView from '../views/service-catalog.view';

describe('Developer Catalog', () => {
  beforeEach(async() => {
    await browser.get(`${appHost}/catalog/ns/${testName}`);
    await crudView.isLoaded();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('clicking on Catalog Tile opens details modal', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);

    await catalogPageView.catalogTiles.first().click();
    await catalogView.catalogDetailsLoaded();
    expect($('.co-catalog-page__overlay-body').isPresent()).toBe(true);
  });

  it('filters catalog tiles by Category', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);

    const origNumItems = await catalogView.pageHeadingNumberOfItems();

    expect(catalogView.categoryTabs.isPresent()).toBe(true);
    await catalogView.categoryTabs.get(1).click(); // click 'Languages' tab
    await crudView.isLoaded();

    expect(catalogView.pageHeading.getText()).toEqual('Languages');
    const numLanguagesItems = await catalogView.pageHeadingNumberOfItems();
    expect(numLanguagesItems).toBeLessThan(origNumItems);
  });

  it('displays "Jenkins" catalog tile when filter by name: "jenkins"', async() => {
    await catalogPageView.filterByKeyword('jenkins');
    expect(catalogPageView.catalogTileFor('Jenkins').isDisplayed()).toBe(true);
  });

  it('displays "No Filter Results" page correctly', async() => {
    await catalogPageView.filterByKeyword('NoFilterResultsTest');
    await catalogPageView.clickFilterCheckbox('kind-ImageStream');
    expect(catalogPageView.catalogTiles.count()).toBe(0);
    expect(catalogPageView.filterCheckboxFor('kind-ImageStream').isSelected()).toBe(true);
    expect(catalogPageView.clearFiltersText.isDisplayed()).toBe(true);

    await catalogPageView.clearFiltersText.click();
    expect(catalogPageView.filterTextbox.getAttribute('value')).toEqual('');

    expect(catalogPageView.filterCheckboxFor('kind-ImageStream').isSelected()).toBe(false);
    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });

  it('filters catalog tiles by \'Service Class\' Type correctly', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);

    const srvClassFilterCount = await catalogPageView.filterCheckboxCount('kind-ClusterServiceClass');

    // 'Node.js' is source-to-image and should be shown initially
    expect(catalogPageView.catalogTileFor('Node.js').isDisplayed()).toBe(true);

    await catalogPageView.clickFilterCheckbox('kind-ClusterServiceClass');
    // 'Jenkins' is service-class and should be shown
    expect(catalogPageView.catalogTileFor('Jenkins').isDisplayed()).toBe(true);
    // 'Node.js' is s-2-i and should not be shown
    expect(catalogPageView.catalogTileFor('Node.js').isPresent()).toBe(false);

    const numCatalogTiles = await catalogView.pageHeadingNumberOfItems();
    // after checking '[X] Service Class', the number of tiles should equal the 'Service Class' filter count
    expect(srvClassFilterCount).toEqual(numCatalogTiles);
  });

  it('filters catalog tiles by \'Source-To-Image\' Type correctly', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);

    const srvClassFilterCount = await catalogPageView.filterCheckboxCount('kind-ImageStream');

    // 'Jenkins' is service class and should be shown initially
    expect(catalogPageView.catalogTileFor('Jenkins').isDisplayed()).toBe(true);

    await catalogPageView.clickFilterCheckbox('kind-ImageStream');
    // 'Node.js' is s-2-i and should be shown
    expect(catalogPageView.catalogTileFor('Node.js').isPresent()).toBe(true);
    // 'Jenkins' is service-class and should not be shown
    expect(catalogPageView.catalogTileFor('Jenkins').isPresent()).toBe(false);

    const numCatalogTiles = await catalogView.pageHeadingNumberOfItems();
    expect(srvClassFilterCount).toEqual(numCatalogTiles);
  });

  it('creates a service instance and binding', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);

    await catalogPageView.clickFilterCheckbox('kind-ClusterServiceClass');
    await catalogPageView.filterByKeyword('MongoDB');
    expect(catalogPageView.catalogTileFor('MongoDB').isDisplayed()).toBe(true);

    await catalogPageView.catalogTileFor('MongoDB').click();
    await catalogView.catalogDetailsLoaded();

    expect(catalogView.createServiceInstanceButton.isDisplayed()).toBe(true);
    await catalogView.createServiceInstanceButton.click();
    await browser.wait(until.and(crudView.untilNoLoadersPresent, until.presenceOf(catalogView.createServiceInstanceForm)));

    await $('#dropdown-selectbox').click();
    await $$('.dropdown-menu').first().$(`#${testName}-Project-link`).click();
    await srvCatalogView.createButton.click();
    await crudView.isLoaded();

    expect(crudView.resourceTitle.getText()).toEqual('mongodb-persistent');

    await catalogView.createServiceBindingButton.click();
    await browser.wait(crudView.untilNoLoadersPresent);
    expect($('#resource-title').getText()).toBe('Create Service Binding');

    await srvCatalogView.createButton.click();
    await crudView.isLoaded();

    expect($('#resource-title').getText()).toBe('mongodb-persistent');
    expect($$('.co-section-heading').first().getText()).toBe('Service Binding Overview');

    execSync(`kubectl delete -n ${testName} servicebinding mongodb-persistent`);
    execSync(`kubectl delete -n ${testName} serviceinstance mongodb-persistent`);
  });
});
