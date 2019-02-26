/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, by, element, ExpectedConditions as until } from 'protractor';

import * as crudView from './crud.view';

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

export const viewSubscriptionsFor = (name: string) => entryRowFor(name).element(by.partialButtonText('View subscription')).click();

export const viewCatalogDetail = (name: string) => $$('.co-catalogsource-list__section').filter(section => section.$('h3').getText()
  .then(text => text === name)).first().element(by.linkText('View catalog details'))
  .click();

export const createSubscriptionFor = (pkgName: string) => crudView.filterForName(pkgName)
  .then(() => entryRowFor(pkgName).element(by.buttonText('Create Subscription')).click());
