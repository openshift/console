import { $, $$, browser, ExpectedConditions as until } from 'protractor';

export const categoryTabs = $$('.vertical-tabs-pf-tab > a');
export const pageHeading = $('.co-catalog-page__heading');
export const pageNumberItemsHeading = $('.co-catalog-page__num-items');
export const pageHeadingNumberOfItems = () => pageNumberItemsHeading.getText()
  .then(text => parseInt(text.substring(0, text.indexOf(' items')), 10));
export const catalogDetailsLoaded = () => browser.wait(until.presenceOf($('.modal-content')), 10000).then(() => browser.sleep(1000));
