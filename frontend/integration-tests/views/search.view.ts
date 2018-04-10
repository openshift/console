import { $, $$, browser, ExpectedConditions as until } from 'protractor';

const BROWSER_TIMEOUT = 15000;

export const dropdown = $('.btn--dropdown__content-wrap');
export const dropdownLinks = $$('.dropdown-menu a');
export const labelFilter = $('.co-m-selector-input input');


export const selectSearchType = function(objectType: string) {
  dropdownLinks.isPresent()
    .then((isPresent) => {
      if(!isPresent){
        dropdown.click();
        browser.wait(until.elementToBeClickable(dropdownLinks.first()), BROWSER_TIMEOUT);
      }
      dropdownLinks.filter(function(elem) {
        return elem.getText().then(function(text) {
          return text.toLowerCase().includes(objectType.toLowerCase());
        });
      }).first().click()
        .then(() => {
          browser.wait(until.elementToBeClickable(labelFilter), BROWSER_TIMEOUT);
        }) ;
    });
};
