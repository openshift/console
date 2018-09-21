import { browser, $, element, by, ExpectedConditions as until, Key } from 'protractor';

import { appHost, testName } from '../protractor.conf';
import * as crudView from './crud.view';

export const createApplicationButton = element(by.buttonText('Create Application'));
export const isLoaded = () => browser.wait(until.presenceOf($('.co-source-to-image-form')));
export const nsDropdown = $('#namespace');
export const nameInput = $('#name');
export const trySampleButton = element(by.partialButtonText('Try Sample'));
export const routeCheckbox = $('.checkbox input');
export const submitButton = $('.btn-primary');
export const errorMessage = $('.alert-danger');

export const visitOpenShiftImageStream = async(name: string) => {
  await browser.get(`${appHost}/k8s/ns/openshift/imagestreams/${name}`);
  await crudView.isLoaded();
};

export const selectTestProject = async() => {
  await nsDropdown.click().then(() => browser.actions().sendKeys(testName, Key.ARROW_DOWN, Key.ENTER).perform());
};
