/* eslint-disable no-undef, no-unused-vars */

import { browser, $ } from 'protractor';

import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as catalogView from '../views/catalog.view';
import * as catalogPageView from '../views/catalog-page.view';

describe('Catalog', () => {
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

    // test 'View All' category filtering
    expect(catalogView.categoryViewAllLinks.isPresent()).toBe(true);
    await catalogView.categoryViewAllLinks.get(0).click(); // View All Java
    expect(catalogView.pageHeading.getText()).toEqual('Java');
    const numJavaItems = await catalogView.pageHeadingNumberOfItems();
    expect(numJavaItems).toBeLessThan(numLanguagesItems);
    // since viewing all tiles, # catalog items visible should equal header count label
    expect(catalogPageView.catalogTiles.count()).toEqual(numJavaItems);
  });

  it('displays ".NET Core" catalog tile when filter by name: "net"', async() => {
    await catalogPageView.filterByKeyword('net');
    expect(catalogPageView.catalogTileFor('.NET Core').isDisplayed()).toBe(true);
  });

  it('displays "No Filter Results" page correctly', async() => {
    await catalogPageView.filterByKeyword('NoFilterResultsTest');
    expect(catalogPageView.catalogTiles.count()).toBe(0);
    expect(catalogPageView.clearFiltersText.isDisplayed()).toBe(true);

    await catalogPageView.clearFiltersText.click();
    expect(catalogPageView.filterTextbox.getAttribute('value')).toEqual('');
    expect(catalogPageView.activeFilterCheckboxes.count()).toBe(0);
    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });

  it('filters catalog tiles by \'Service Class\' Type correctly', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);

    const srvClassFilterCount = await catalogPageView.filterCheckboxCount('Service Class');
    // '.NET Core' is source-to-image
    expect(catalogPageView.catalogTileFor('.NET Core').isDisplayed()).toBe(true);

    await catalogPageView.clickFilterCheckbox('Service Class');
    const numCatalogTiles = await catalogView.pageHeadingNumberOfItems();
    // after checking '[X] Service Class (12)', the number of tiles should equal the 'Service Class' filter count
    expect(srvClassFilterCount).toEqual(numCatalogTiles);
    // // '.NET Core' is s-t-i and should not be shown
    expect(catalogPageView.catalogTileFor('.NET Core').isPresent()).toBe(false);
  });

  it('filters catalog tiles by \'Source-To-Image\' Type correctly', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);

    const srvClassFilterCount = await catalogPageView.filterCheckboxCount('Source-To-Image');
    // '.NET Core Example' is service class
    expect(catalogPageView.catalogTileFor('.NET Core Example').isDisplayed()).toBe(true);

    await catalogPageView.clickFilterCheckbox('Source-To-Image');
    const numCatalogTiles = await catalogView.pageHeadingNumberOfItems();
    expect(srvClassFilterCount).toEqual(numCatalogTiles);
    // // '.NET Core Example' is service-class and should not be shown
    expect(catalogPageView.catalogTileFor('.NET Core Example').isPresent()).toBe(false);
  });
});
