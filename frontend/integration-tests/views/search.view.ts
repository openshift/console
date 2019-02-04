import { $, $$, browser, ExpectedConditions as until } from 'protractor';

const BROWSER_TIMEOUT = 15000;

export const dropdown = $('.co-type-selector .btn-dropdown');
export const dropdownLinks = $$('.dropdown-menu a');
export const labelFilter = $('.co-m-selector-input input');
export const linkForType = type => $(`#${type}-link`);

export const selectSearchType = async(objectType: string) => {
  const isPresent = await dropdownLinks.isPresent();
  if (!isPresent) {
    await dropdown.click();
    await browser.wait(until.elementToBeClickable(linkForType(objectType)), BROWSER_TIMEOUT);
  }
  await linkForType(objectType).click();
  await browser.wait(until.elementToBeClickable(labelFilter), BROWSER_TIMEOUT);
};
