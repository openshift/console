/* eslint-disable no-undef, no-unused-vars */

import { browser, $, ExpectedConditions as until } from 'protractor';

// Modal views
export const operatorModal = $('.modal-content');
export const operatorModalIsLoaded = () => browser.wait(until.presenceOf(operatorModal), 1000)
  .then(() => browser.sleep(500));
export const operatorModalTitle = operatorModal.$('.catalog-item-header-pf-title');
export const closeOperatorModal = () => operatorModal.$('.close').click();
export const operatorModalIsClosed = () => browser.wait(until.not(until.presenceOf(operatorModal)), 1000)
  .then(() => browser.sleep(500));
