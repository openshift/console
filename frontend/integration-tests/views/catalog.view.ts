/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, by, element, ExpectedConditions as until, Key } from 'protractor';

const rowSelector = '.co-resource-list__item';
export const entryRows = $$(rowSelector);
export const entryRowFor = (name: string) => element(by.cssContainingText(rowSelector, name));

export const isLoaded = () => browser.wait(until.presenceOf($('.loading-box__loaded')), 10000).then(() => browser.sleep(500));

export const hasSubscription = (name: string) => browser.getCurrentUrl().then(url => {
  if (url.indexOf('all-namespaces') > -1) {
    throw new Error('Cannot call `hasSubscription` for all namespaces');
  }
  return entryRowFor(name).element(by.buttonText('Create Subscription')).isPresent();
}).then(canSubscribe => !canSubscribe);

export const createSubscriptionView = $('.co-create-subscription');
export const subscriptionNSDropdown = createSubscriptionView.$$('.btn.btn--dropdown').first();

/**
 * Returns a promise that resolves to the row for a given namespace in the enable/disable modal.
 */
export const selectNamespace = (namespace: string) => subscriptionNSDropdown.click()
  .then(() => browser.actions().sendKeys(namespace, Key.ARROW_DOWN, Key.ENTER).perform());
