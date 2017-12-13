/* eslint-disable no-undef, no-unused-vars */

import { browser, $, $$, by, ExpectedConditions as until } from 'protractor';

export const entryRows = $$('.co-resource-list__item');
export const entryRowFor = (name: string) => entryRows.filter((row) => row.$('.co-clusterserviceversion-logo__name__clusterserviceversion').getText()
  .then(text => text === name)).first();

export const isLoaded = () => browser.wait(until.presenceOf($('.loading-box__loaded')), 10000);

export const enableModal = $('.co-catalog-install-modal');
export const disableModal = $('.co-catalog-install-modal');

export const enableModalConfirm = () => enableModal.element(by.buttonText('Enable')).click().then(() => browser.sleep(1000));

export const selectNamespaceRows = enableModal.$$('.co-resource-list__item');

/**
 * Returns a promise that resolves to the row for a given namespace in the enable/disable modal.
 */
export const selectNamespaceRowFor = (namespace: string) => selectNamespaceRows.filter((row) => row.$('.co-m-resource-namespace + span').getText()
  .then(text => text === namespace)).first();

export const detailedBreakdownFor = (name: string) => entryRowFor(name).$('.co-catalog-app-row__details');

export const namespaceListFor = (name: string) => detailedBreakdownFor(name).$$('.co-catalog-breakdown__ns-list__item');

export const namespaceEnabledFor = (name: string) => (namespace: string) => namespaceListFor(name).filter(e => e.getText().then(text => text === namespace)).isPresent();
