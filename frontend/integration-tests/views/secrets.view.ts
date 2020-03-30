import { $, $$, browser, by, ExpectedConditions as until, element } from 'protractor';
import { Base64 } from 'js-base64';
import { execSync } from 'child_process';
import * as _ from 'lodash';

import * as crudView from '../views/crud.view';

export const secretNameInput = $('#secret-name');
export const pre = $$('.co-copy-to-clipboard__text');
export const dt = $$('dl.secret-data dt');

export const saveButton = $('#save-changes');
export const authTypeDropdown = $('#dropdown-selectbox');
export const authSSHOption = element(by.partialButtonText('SSH Key'));
export const authConfigFileOption = element(by.partialButtonText('Upload Configuration File'));

export const secretWebhookInput = $('input[name=webhookSecretKey]');
export const secretAddressInput = $('input[name=address]');
export const secretUsernameInput = $('input[name=username]');
export const secretPasswordInput = $('input[name=password]');
export const secretEmailInput = $('input[name=email]');
export const secretKeyInput = $('input[name=key]');

export const uploadFileTextArea = $('.co-file-dropzone__textarea');

export const createWebhookSecretLink = $('#webhook-link');
export const createSourceSecretLink = $('#source-link');
export const createImageSecretLink = $('#image-link');
export const createGenericSecretLink = $('#generic-link');

export const addSecretEntryLink = $('.co-create-secret-form__link--add-entry');
export const removeSecretEntryLink = $$(
  '.co-add-remove-form__link--remove-entry .pf-m-link',
).first();
export const imageSecretForm = $$('[data-test-id="create-image-secret-form"]');
export const genericSecretForm = $$('.co-create-generic-secret__form');

const revealValuesButton = element(by.partialButtonText('Reveal Values'));
const addSecrettoWorkloadButton = element(by.partialButtonText('Add Secret to Workload'));

const selectWorkloadBtn = $('#co-add-secret-to-workload__workload');
const addSecretAsEnv = $('#co-add-secret-to-workload__envvars');
const addSecretAsVol = $('#co-add-secret-to-workload__volume');
const addSecretAsEnvPrefixInput = $('#co-add-secret-to-workload__prefix');
const addSecretAsVolMntPathInput = $('#co-add-secret-to-workload__mountpath');

export const visitSecretsPage = async (appHost: string, ns: string) => {
  await browser.get(`${appHost}/k8s/ns/${ns}/secrets`);
  await crudView.isLoaded();
};

export const visitSecretDetailsPage = async (appHost: string, ns: string, secretname: string) => {
  await browser.get(`${appHost}/k8s/ns/${ns}/secrets/${secretname}`);
  await crudView.isLoaded();
};

export const clickAddSecretToWorkload = async () => {
  await browser.wait(until.presenceOf(addSecrettoWorkloadButton));
  await addSecrettoWorkloadButton.click();
};

export const clickRevealValues = async () => {
  await browser.wait(until.presenceOf(revealValuesButton));
  await revealValuesButton.click();
};

export const encode = (username, password) => Base64.encode(`${username}:${password}`);

export const createSecret = async (
  linkElement: any,
  ns: string,
  name: string,
  updateForm: Function,
) => {
  await crudView.createItemButton.click();
  await linkElement.click();
  await browser.wait(until.presenceOf(secretNameInput));
  await secretNameInput.sendKeys(name);
  await updateForm();
  await saveButton.click();
  expect(crudView.errorMessage.isPresent()).toBe(false);
};

export const checkSecret = async (
  ns: string,
  name: string,
  keyValuesToCheck: Object,
  jsonOutput: boolean = false,
) => {
  await browser.wait(until.urlContains(`/k8s/ns/${ns}/secrets/${name}`));
  await browser.wait(until.textToBePresentInElement($('.co-m-pane__heading'), name));
  await clickRevealValues();
  const renderedKeyValues = await dt.reduce(async (acc, el, index) => {
    const key = await el.getAttribute('textContent');
    const value = await pre.get(index).getText();
    acc[key] = jsonOutput ? JSON.parse(value) : value;
    return acc;
  }, {});
  expect(renderedKeyValues).toEqual(keyValuesToCheck);
};

export const editSecret = async (ns: string, name: string, updateForm: Function) => {
  await crudView.clickDetailsPageAction('Edit Secret');
  await browser.wait(until.urlContains(`/k8s/ns/${ns}/secrets/${name}/edit`));
  await browser.wait(until.and(crudView.untilNoLoadersPresent, until.presenceOf(secretNameInput)));
  await updateForm();
  await saveButton.click();
  expect(crudView.errorMessage.isPresent()).toBe(false);
};

export const addSecretToWorkloadAsEnv = async (workloadname: string, EnvPrefix: string) => {
  await clickAddSecretToWorkload();
  await browser.wait(until.presenceOf(selectWorkloadBtn));
  await selectWorkloadBtn.click();
  await browser.wait(until.presenceOf($('li[role=option]')), 5000);
  await element(by.cssContainingText('li[role=option] a', workloadname)).click();
  await addSecretAsEnv.click();
  await addSecretAsEnvPrefixInput.sendKeys(EnvPrefix);
  await $('#confirm-action').click();
};

export const addSecretToWorkloadAsVol = async (workloadname: string, MntPath: string) => {
  await clickAddSecretToWorkload();
  await browser.wait(until.presenceOf(selectWorkloadBtn));
  await selectWorkloadBtn.click();
  await browser.wait(until.presenceOf($('li[role=option]')), 5000);
  await element(by.cssContainingText('li[role=option] a', workloadname)).click();
  await addSecretAsVol.click();
  await addSecretAsVolMntPathInput.sendKeys(MntPath);
  await $('#confirm-action').click();
};

export const getResourceJSON = (name: string, namespace: string, kind: string) => {
  return execSync(`kubectl get -o json -n ${namespace} ${kind} ${name}`).toString();
};

export const isValueInJSONPath = (
  propertyPath: string,
  value: string,
  name: string,
  namespace: string,
  kind: string,
): boolean => {
  const resource = JSON.parse(getResourceJSON(name, namespace, kind));
  const result = _.get(resource, propertyPath, undefined);
  return result === value;
};
