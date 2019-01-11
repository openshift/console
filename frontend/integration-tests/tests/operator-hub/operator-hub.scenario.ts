/* eslint-disable no-undef, no-unused-vars */

import { browser } from 'protractor';

import { appHost, checkLogs, checkErrors } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as catalogView from '../../views/catalog.view';
import * as catalogPageView from '../../views/catalog-page.view';
import * as operatorHubView from '../../views/operator-hub.view';

describe('Viewing the operators in Operator Hub', () => {
  const openCloudServices = new Set(['etcd', 'prometheus']);

  beforeEach(async() => {
    await browser.get(`${appHost}/operatorhub`);
    await crudView.isLoaded();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays Operator Hub with expected available operators', async() => {

    openCloudServices.forEach(name => {
      expect(catalogPageView.catalogTileFor(name).isDisplayed()).toBe(true);
    });
  });

  it('displays etcd operator when filter "CoreOS" is active', async() => {
    await catalogPageView.clickFilterCheckbox('CoreOS');

    expect(catalogPageView.catalogTileFor('etcd').isDisplayed()).toBe(true);

    await catalogPageView.clickFilterCheckbox('CoreOS');
  });

  it('does not display etcd operator when filter "Red Hat" is active', async() => {
    await catalogPageView.clickFilterCheckbox('Red Hat');

    expect(catalogPageView.catalogTileCount('etcd')).toBe(0);

    await catalogPageView.clickFilterCheckbox('Red Hat');
  });

  it('displays "prometheus" as an operator when using the filter "p"', async() => {
    await catalogPageView.filterByKeyword('p');

    expect(catalogPageView.catalogTileFor('prometheus').isDisplayed()).toBe(true);

    await catalogPageView.filterByKeyword('');
  });

  it('displays "Clear All Filters" text when filters remove all operators from display', async() => {
    await catalogPageView.filterByKeyword('NoOperatorsTest');

    expect(catalogPageView.catalogTiles.count()).toBe(0);
    expect(catalogPageView.clearFiltersText.isDisplayed()).toBe(true);
  });

  it('clears all filters when "Clear All Filters" text is clicked', async() => {
    await catalogPageView.filterByKeyword('NoOperatorsTest');
    await catalogPageView.clearFiltersText.click();

    expect(catalogPageView.filterTextbox.getAttribute('value')).toEqual('');
    expect(catalogPageView.activeFilterCheckboxes.count()).toBe(0);

    openCloudServices.forEach(name => {
      expect(catalogPageView.catalogTileFor(name).isDisplayed()).toBe(true);
    });
  });

  openCloudServices.forEach(name => {
    it(`displays OperatorHubModalOverlay with correct content when ${name} operator is clicked`, async() => {
      catalogPageView.catalogTileFor(name).click();
      await operatorHubView.operatorModalIsLoaded();

      expect(operatorHubView.operatorModal.isDisplayed()).toBe(true);
      expect(operatorHubView.operatorModalTitle.getText()).toEqual(name);

      await operatorHubView.closeOperatorModal();
      await operatorHubView.operatorModalIsClosed();
    });
  });

  it('filters Operator Hub tiles by Category', async() => {
    expect(catalogPageView.catalogTiles.isPresent()).toBe(true);
    expect(catalogView.categoryTabs.isPresent()).toBe(true);
  });

});
