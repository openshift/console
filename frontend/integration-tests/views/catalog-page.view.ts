import { $, $$, element, by } from 'protractor';

export const catalogTiles = $$('.catalog-tile-pf');
export const catalogTileFor = (name: string) => element(by.cssContainingText('.catalog-tile-pf-title', name));
export const catalogTileById = (id: string) => $(`[data-test=${id}]`);

// FilterSidePanel views
export const showMoreFilters = (group: string) => $(`[data-test-group-name=${group}] .btn-link`);
export const filterCheckboxFor = (id: string) => $(`input[data-test=${id}]`);
export const clickFilterCheckbox = (id: string) => filterCheckboxFor(id).click();
export const filterCheckboxCount = (id: string) => filterCheckboxFor(id).$('.item-count').getText()
  .then(text => parseInt(text.substring(1, text.indexOf(')')), 10));
export const filterTextbox = $$('.filter-panel-pf-category').first().$('input');
export const filterByKeyword = (filter: string) => filterTextbox.sendKeys(filter);
export const clearFiltersText = $('.co-catalog-page__no-filter-results').$('.blank-slate-pf-helpLink').$('button');
