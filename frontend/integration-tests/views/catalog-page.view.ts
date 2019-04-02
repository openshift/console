import { $, $$ } from 'protractor';

export const catalogTiles = $$('.catalog-tile-pf');
export const catalogTileFor = (name: string) => catalogTiles.filter((tile) => tile.$('.catalog-tile-pf-title').getText()
  .then(text => text === name)).first();
export const catalogTileById = (id: string) => $(`[data-test=${id}]`);

// FilterSidePanel views
export const filterCheckboxFor = (id: string) => $(`input[data-test=${id}]`);
export const clickFilterCheckbox = (id: string) => filterCheckboxFor(id).click();
export const filterCheckboxCount = (id: string) => filterCheckboxFor(id).$('.item-count').getText()
  .then(text => parseInt(text.substring(1, text.indexOf(')')), 10));
export const filterTextbox = $$('.filter-panel-pf-category').first().$('input');
export const filterByKeyword = (filter: string) => filterTextbox.sendKeys(filter);
export const clearFiltersText = $('.co-catalog-page__no-filter-results').$('.blank-slate-pf-helpLink').$('button');
