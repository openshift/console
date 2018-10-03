/* eslint-disable no-unused-vars */
import { $, $$, browser, by, ExpectedConditions as until, element, ElementFinder } from 'protractor';

import * as crudView from '../views/crud.view';

export const secretNameInput = $('#secret-name');
export const pre = $$('.co-copy-to-clipboard__text');
export const dt = $$('dl.secret-data dt');

export const saveButton = $('#save-changes');
export const authTypeDropdown = $('#dropdown-selectbox');

export const webhookSecretValueInput = $('input[name=webhookSecretKey]');
export const sourceSecretUsernameInput = $('input[name=username]');
export const sourceSecretPasswordInput = $('input[name=password]');
export const sourceSecretSSHTextArea = $('.co-file-dropzone__textarea');

export const createWebhookSecretLink = $('#webhook-link');
export const createSourceSecretLink = $('#source-link');

export const visitSecretsPage = async(appHost: string, ns: string) => {
  await browser.get(`${appHost}/k8s/ns/${ns}/secrets`);
  await crudView.isLoaded();
};

export const createSecret = async(linkElement: ElementFinder, ns: string, name: string, updateForm: Function) => {
  await crudView.createItemButton.click();
  await linkElement.click();
  await secretNameInput.sendKeys(name);
  await updateForm();
  await saveButton.click();
  expect(crudView.errorMessage.isPresent()).toBe(false);
};

export const checkSecret = async(ns: string, name: string, keyValuesToCheck: Object) => {
  await browser.wait(until.urlContains(`/k8s/ns/${ns}/secrets/${name}`));
  await browser.wait(until.textToBePresentInElement($('.co-m-pane__heading'), name));
  await element(by.partialButtonText('Reveal Values')).click();
  const renderedKeyValues = await dt.reduce(async(acc, el, index) => {
    const key = await el.getAttribute('textContent');
    const value = await pre.get(index).getText();
    acc[key] = value;
    return acc;
  }, {});
  expect(renderedKeyValues).toEqual(keyValuesToCheck);
};

export const editSecret = async(ns: string, name: string, updateForm: Function) => {
  await crudView.actionsDropdown.click();
  await browser.wait(until.presenceOf(crudView.actionsDropdownMenu), 500);
  await crudView.actionsDropdownMenu.element(by.linkText('Edit Secret')).click();
  await browser.wait(until.urlContains(`/k8s/ns/${ns}/secrets/${name}/edit`));
  await updateForm();
  await saveButton.click();
  expect(crudView.errorMessage.isPresent()).toBe(false);
};
