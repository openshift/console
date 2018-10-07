/* eslint-disable no-unused-vars */
import { $, $$, browser, by, ExpectedConditions as until, element, ElementFinder } from 'protractor';
import { Base64 } from 'js-base64';

import * as crudView from '../views/crud.view';

export const secretNameInput = $('#secret-name');
export const pre = $$('.co-copy-to-clipboard__text');
export const dt = $$('dl.secret-data dt');

export const saveButton = $('#save-changes');
export const authTypeDropdown = $('#dropdown-selectbox');

export const secretWebhookInput = $('input[name=webhookSecretKey]');
export const secretAddressInput = $('input[name=address]');
export const secretUsernameInput = $('input[name=username]');
export const secretPasswordInput = $('input[name=password]');
export const secretEmailInput = $('input[name=email]');

export const uploadFileTextArea = $('.co-file-dropzone__textarea');

export const createWebhookSecretLink = $('#webhook-link');
export const createSourceSecretLink = $('#source-link');
export const createImageSecretLink = $('#image-link');

export const addSecretEntryLink = $('.co-create-secret-form__link--add-entry');
export const removeSecretEntryLink = $('.co-create-secret-form__link--remove-entry .btn-link');
export const imageSecretForm = $$('.co-create-image-secret__form');

export const visitSecretsPage = async(appHost: string, ns: string) => {
  await browser.get(`${appHost}/k8s/ns/${ns}/secrets`);
  await crudView.isLoaded();
};

export const encode = (username, password) => Base64.encode(`${username}:${password}`);

export const createSecret = async(linkElement: ElementFinder, ns: string, name: string, updateForm: Function) => {
  await crudView.createItemButton.click();
  await linkElement.click();
  await secretNameInput.sendKeys(name);
  await updateForm();
  await saveButton.click();
  expect(crudView.errorMessage.isPresent()).toBe(false);
};

export const checkSecret = async(ns: string, name: string, keyValuesToCheck: Object, jsonOutput: boolean = false) => {
  await browser.wait(until.urlContains(`/k8s/ns/${ns}/secrets/${name}`));
  await browser.wait(until.textToBePresentInElement($('.co-m-pane__heading'), name));
  await element(by.partialButtonText('Reveal Values')).click();
  const renderedKeyValues = await dt.reduce(async(acc, el, index) => {
    const key = await el.getAttribute('textContent');
    const value = await pre.get(index).getText();
    acc[key] = jsonOutput ? JSON.parse(value) : value;
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
