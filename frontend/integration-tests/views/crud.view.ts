/* eslint-disable no-undef, no-unused-vars */

import { $, $$, browser, ExpectedConditions as until } from 'protractor';

export const createYAMLButton = $('#yaml-create');

/**
 * Returns a promise that resolves after the loading spinner is not present.
 */
export const isLoaded = () => browser.wait(until.presenceOf($('.loading-box__loaded'))).then(() => browser.sleep(500));

export const resourceRows = $$('.co-resource-list__item');
export const rowForName = (name: string) => resourceRows.filter((row) => row.$('.co-m-resource-icon + a').getText().then(text => text === name)).first();
export const rowDisabled = (name: string) => rowForName(name).$('.co-m-cog--disabled').isPresent();

/**
 * Deletes a row from a list. Does not wait until the row is no longer visible.
 */
export const deleteRow = (kind: string) => (name: string) => rowForName(name).$('.co-m-cog').click()
  .then(() => browser.wait(until.visibilityOf(rowForName(name).$('.co-m-cog__dropdown'))))
  .then(() => rowForName(name).$('.co-m-cog__dropdown').$$('a').filter(link => link.getText().then(text => text.startsWith('Delete'))).first().click())
  .then(async() => {
    switch (kind) {
      case 'Namespace':
        await browser.wait(until.presenceOf($('input[placeholder="Enter name"]')));
        await $('input[placeholder="Enter name"]').sendKeys(name);
        break;
      default:
        await browser.wait(until.presenceOf($('#confirm-delete')));
        break;
    }

    return $('#confirm-delete').click();
  });

export const rowFilters = $$('.row-filter--box');
export const rowFilterFor = (name: string) => rowFilters.filter(element => element.getText().then(text => text.includes(name))).first();
export const activeRowFilters = $$('.row-filter--box__active');

export const statusMessageTitle = $('.cos-status-box__title');
export const statusMessageDetail = $('.cos-status-box__detail');

export const actionsDropdown = $('.btn--actions').$('button');
export const actionsDropdownMenu = $('.btn--actions').$('.dropdown-menu');

export const resourceTitle = $('#resource-title');
