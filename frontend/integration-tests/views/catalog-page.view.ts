import { $, $$, browser, by, element, ExpectedConditions as until } from 'protractor';

export const catalogTiles = $$('.catalog-tile-pf');
export const catalogTileFor = (name: string) =>
  element(by.cssContainingText('.catalog-tile-pf-title', name));
export const catalogTileByID = (id: string) => $(`[data-test=${id}]`);

// FilterSidePanel views
export const filterSectionFor = (group: string) => $(`[data-test-group-name=${group}]`);
export const filterCheckboxFor = (id: string) => $(`input[data-test=${id}]`);
export const clickFilterCheckbox = async (id: string) => {
  await browser.wait(until.presenceOf(filterCheckboxFor(id)));
  await filterCheckboxFor(id).click();
};
export const filterCheckboxCount = (id: string) =>
  filterCheckboxFor(id)
    .$('.item-count')
    .getText()
    .then((text) => parseInt(text.substring(1, text.indexOf(')')), 10));
export const filterTextbox = $('.co-catalog-page__filter input');
export const filterByKeyword = (filter: string) =>
  filterTextbox.clear().then(() => filterTextbox.sendKeys(filter));
export const clearFiltersText = $('[data-test-id="catalog-clear-filters"]');
