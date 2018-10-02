/* eslint-disable no-undef, no-unused-vars */

import {browser, $, ExpectedConditions as until, $$, by} from 'protractor';

const cscLinks = $$('.co-cluster-service-class-link');

export const linkForCSC = (name: string) => cscLinks.filter((row) => row.getText().then(text => text === name)).first();
export const cscLinksPresent = () => browser.wait(until.presenceOf($('.co-cluster-service-class-link')), 10000);

export const createInstanceButton = $('.btn-primary.co-action-buttons__btn');
export const createInstanceFormIsLoaded = () => browser.wait(until.presenceOf($('.co-create-service-instance__namespace')), 10000).then(() => browser.sleep(500));
export const createBindingFormIsLoaded = () => browser.wait(until.presenceOf($('.co-create-service-binding__name')), 10000).then(() => browser.sleep(500));
export const createButton = $('.co-m-btn-bar').element(by.buttonText('Create'));
