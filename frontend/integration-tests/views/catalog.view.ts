/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, by, ExpectedConditions as until, ElementFinder } from 'protractor';

const moveTo = (elem: ElementFinder) => browser.actions().mouseMove(elem).perform().then(() => elem);

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

export const createSubscriptionFor = (pkgName: string) => moveTo(
  entryRowFor(pkgName).element(by.buttonText('Create Subscription'))).then(el => el.click()
);
