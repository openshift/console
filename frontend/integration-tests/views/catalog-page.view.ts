/* eslint-disable no-undef, no-unused-vars */

import { $, $$ } from 'protractor';

export const catalogTiles = $$('.catalog-tile-pf');
export const catalogTileFor = (name: string) => catalogTiles.filter((tile) => tile.$('.catalog-tile-pf-title').getText()
  .then(text => text === name)).first();
export const catalogTileCount = (name: string) => catalogTiles.filter((tile) => tile.$('.catalog-tile-pf-title').getText()
  .then(text => text === name)).count();

// FilterSidePanel views
export const filterCheckboxes = $$('.filter-panel-pf-category-item');
// Using string  includes() since filter provider names aren't standard
export const filterCheckboxFor = (name: string) => filterCheckboxes.filter((filterItem) => filterItem.$('label').getText()
  .then(text => text.toLowerCase().includes(name.toLowerCase()))).first();
export const clickFilterCheckbox = (name: string) => filterCheckboxFor(name).$('input').click();
export const filterCheckboxCount = (name: string) => filterCheckboxFor(name).$('.item-count').getText()
  .then(text => parseInt(text.substring(1, text.indexOf(')')), 10));
export const activeFilterCheckboxes = filterCheckboxes.filter((filterItem) => filterItem.$('input').isSelected()
  .then(bool => bool));
export const filterTextbox = $$('.filter-panel-pf-category').first().$('input');
export const filterByName = (filter: string) => filterTextbox.sendKeys(filter);
export const clearFiltersText = $('.co-catalog-page__no-filter-results').$('.blank-slate-pf-helpLink').$('button');
