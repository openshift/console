import { browser, $, element, by, ExpectedConditions as until } from 'protractor';

import { appHost, testName } from '../protractor.conf';
import * as crudView from './crud.view';

export const createApplicationButton = element(by.buttonText('Create Application'));
export const isLoaded = () => browser.wait(until.and(crudView.untilNoLoadersPresent, until.presenceOf($('.co-source-to-image-form'))));
export const nsDropdown = $('#namespace');
export const nameInput = $('#name');
export const trySampleButton = element(by.partialButtonText('Try Sample'));
export const routeCheckbox = $('.checkbox input');
export const submitButton = $('.btn-primary');

export const visitOpenShiftImageStream = async(name: string) => {
  await browser.get(`${appHost}/k8s/ns/openshift/imagestreams/${name}`);
  await crudView.isLoaded();
};

export const selectTestProject = async() => {
  await nsDropdown.click();
  await browser.wait(until.visibilityOf($('.dropdown-menu')));
  await element(by.cssContainingText('li[role=option] a', testName)).click();
  await browser.wait(until.not(until.visibilityOf($('.dropdown-menu'))));
};
