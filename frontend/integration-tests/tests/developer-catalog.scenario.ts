import { browser, $, ExpectedConditions as until } from 'protractor';
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
    await crudView.isLoaded();
    expect(catalogPageView.catalogTileFor('Jenkins').isDisplayed()).toBe(true);
  });

  it('displays "No Filter Results" page correctly', async() => {
    await catalogPageView.filterByKeyword('NoFilterResultsTest');
    await catalogPageView.clickFilterCheckbox('kind-image-stream');
    expect(catalogPageView.catalogTiles.count()).toBe(0);
    expect(catalogPageView.filterCheckboxFor('kind-image-stream').isSelected()).toBe(true);
    expect(catalogPageView.clearFiltersText.isDisplayed()).toBe(true);

    await catalogPageView.clearFiltersText.click();
    await crudView.isLoaded();
    expect(catalogPageView.filterTextbox.getAttribute('value')).toEqual('');

    expect(catalogPageView.filterCheckboxFor('kind-image-stream').isSelected()).toBe(false);
    expect(catalogPageView.catalogTiles.count()).toBeGreaterThan(0);
  });

  it('filters catalog tiles by \'Source-To-Image\' Type correctly', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);

    const srvClassFilterCount = await catalogPageView.filterCheckboxCount('kind-image-stream');

    // 'Jenkins' is service class and should be shown initially
    expect(catalogPageView.catalogTileFor('Jenkins').isDisplayed()).toBe(true);

    await catalogPageView.clickFilterCheckbox('kind-image-stream');
    // 'Node.js' is s-2-i and should be shown
    expect(catalogPageView.catalogTileFor('Node.js').isPresent()).toBe(true);
    // 'Jenkins' is service-class and should not be shown
    expect(catalogPageView.catalogTileFor('Jenkins').isPresent()).toBe(false);

    const numCatalogTiles = await catalogView.pageHeadingNumberOfItems();
    expect(srvClassFilterCount).toEqual(numCatalogTiles);
  });

  it('filters catalog tiles by \'Template\' type correctly', async() => {
    await catalogPageView.catalogTiles;
    await catalogPageView.clickFilterCheckbox('kind-template');
    await crudView.isLoaded();
    expect(catalogPageView.catalogTileFor('CakePHP + MySQL (Ephemeral)').isPresent()).toBe(true);
    expect(catalogPageView.catalogTileFor('Python').isPresent()).toBe(false);
  });

  it('create a template instance', async() => {
    await catalogPageView.catalogTiles;
    await catalogPageView.clickFilterCheckbox('kind-template');
    await crudView.isLoaded();
    expect(catalogPageView.catalogTileFor('Dancer + MySQL (Ephemeral)').isDisplayed()).toBe(true);

    await catalogPageView.catalogTileFor('Dancer + MySQL (Ephemeral)').click();
    await catalogView.catalogDetailsLoaded();
    await catalogView.createResourceButton.click();
    await browser.wait(until.and(crudView.untilNoLoadersPresent, until.presenceOf(catalogView.instantiateTemplateFrom)));
    await srvCatalogView.createButton.click();
    await crudView.isLoaded();

    expect(catalogView.templateInstanceItem.isDisplayed()).toBe(true);
    expect(catalogView.templateInstanceName.getText()).toContain('dancer-mysql-example-');
    expect(catalogView.templateInstanceResource('Secret', 'dancer-mysql-example').isPresent()).toBe(true);
    expect(catalogView.templateInstanceResource('Service', 'dancer-mysql-example').isPresent()).toBe(true);
    expect(catalogView.templateInstanceResource('Service', 'database').isPresent()).toBe(true);
    expect(catalogView.templateInstanceResource('Route', 'dancer-mysql-example').isPresent()).toBe(true);
    expect(catalogView.templateInstanceResource('ImageStream', 'dancer-mysql-example').isPresent()).toBe(true);
    expect(catalogView.templateInstanceResource('BuildConfig', 'dancer-mysql-example').isPresent()).toBe(true);
    expect(catalogView.templateInstanceResource('DeploymentConfig', 'dancer-mysql-example').isPresent()).toBe(true);
    expect(catalogView.templateInstanceResource('DeploymentConfig', 'database').isPresent()).toBe(true);
  });
});
