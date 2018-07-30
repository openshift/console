/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, by, ExpectedConditions as until, Key } from 'protractor';

export const entryRows = $$('.co-resource-list__item');
export const entryRowFor = (name: string) => entryRows.filter((row) => row.$('.co-clusterserviceversion-logo__name__clusterserviceversion').getText()
  .then(text => text === name)).first();

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
