import { $, $$, browser, ExpectedConditions as until } from 'protractor';

const BROWSER_TIMEOUT = 15000;

export const dropdown = $('.co-type-selector .pf-c-dropdown__toggle');
export const dropdownLinks = $$('.pf-c-dropdown__menu a');
export const labelFilter = $('.co-search-input input');
export const linkForType = (type) => $(`#${type}-link`);

export const selectSearchType = async (objectType: string) => {
  const isPresent = await dropdownLinks.isPresent();
  if (!isPresent) {
    await dropdown.click();
    await browser.wait(until.elementToBeClickable(linkForType(objectType)), BROWSER_TIMEOUT);
  }
  await linkForType(objectType).click();
  await browser.wait(until.elementToBeClickable(labelFilter), BROWSER_TIMEOUT);
};
