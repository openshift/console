/* eslint-disable no-undef, no-unused-vars */

import { browser, $, ExpectedConditions as until, $$, by, element } from 'protractor';

export const operatorModal = $('.modal-content');
export const operatorModalIsLoaded = () => browser.wait(until.presenceOf(operatorModal), 1000)
  .then(() => browser.sleep(500));
export const operatorModalTitle = operatorModal.$('.catalog-item-header-pf-title');
export const operatorModalInstallBtn = operatorModal.element(by.buttonText('Install'));
export const closeOperatorModal = () => operatorModal.$('.close').click();
export const operatorModalIsClosed = () => browser.wait(until.not(until.presenceOf(operatorModal)), 1000)
  .then(() => browser.sleep(500));
export const viewInstalledOperator = () => $('.hint-block-pf').element(by.linkText('View it here.')).click();

export const createSubscriptionFormTitle = element(by.cssContainingText('h1', 'Create Operator Subscription'));
export const createSubscriptionFormBtn = element(by.buttonText('Subscribe'));
export const createSubscriptionFormInstallMode = element(by.cssContainingText('label', 'Installation Mode'));

export const showCommunityOperators = async() => {
  await $$('.co-catalog-page__filter-toggle').click();
  await browser.wait(until.presenceOf($('.co-modal-ignore-warning')), 1000).then(() => browser.sleep(500));
  await $('.co-modal-ignore-warning').$('.btn-primary').click();
  await browser.wait(until.not(until.presenceOf($('.co-modal-ignore-warning'))), 1000).then(() => browser.sleep(500));
};

export const createSubscriptionFormTitleIsPresent = () => browser.wait(until.presenceOf(createSubscriptionFormTitle));
