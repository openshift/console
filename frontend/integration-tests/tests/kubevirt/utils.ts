/* eslint-disable no-unused-vars, no-undef */
import * as _ from 'lodash';
import { execSync } from 'child_process';
import { $, by, ElementFinder, browser, ExpectedConditions as until } from 'protractor';
import { nameInput as loginNameInput, passwordInput as loginPasswordInput, submitButton as loginSubmitButton } from '../../views/login.view';

const SEC = 1000;
export const CLONE_VM_TIMEOUT = 300 * SEC;
export const PAGE_LOAD_TIMEOUT = 15 * SEC;
export const VM_ACTIONS_TIMEOUT = 120 * SEC;
export const VM_BOOTUP_TIMEOUT = 90 * SEC;
export const VM_STOP_TIMEOUT = 6 * SEC;

export type provisionOptions = {
  method: string,
  source?: string,
};

export type networkResource = {
  name: string,
  mac: string,
  binding: string,
  networkDefinition: string,
}[];

export type storageResource = {
  name: string,
  size: string,
  StorageClass: string,
}[];

export function removeLeakedResources(leakedResources: Set<string>) {
  const leakedArray: Array<string> = [...leakedResources];
  if (leakedArray.length > 0) {
    console.error(`Leaked ${leakedArray.join()}`);
    leakedArray.map(r => JSON.parse(r) as {name: string, namespace: string, kind: string})
      .forEach(({name, namespace, kind}) => {
        try {
          execSync(`kubectl delete -n ${namespace} --cascade ${kind} ${name}`);
        } catch (error) {
          console.error(`Failed to delete ${kind} ${name}:\n${error}`);
        }
      });
  }
  leakedResources.clear();
}

export async function selectDropdownOption(dropdownId: string, option: string) {
  await browser.wait(until.elementToBeClickable($(dropdownId)))
    .then(() => $(dropdownId).click());
  await $(`${dropdownId} + ul`).element(by.linkText(option)).click();
}

export async function fillInput(elem: ElementFinder, value: string) {
  // Sometimes there seems to be an issue with clear() method not clearing the input
  let attempts = 3;
  do {
    --attempts;
    await browser.wait(until.elementToBeClickable(elem));
    await elem.clear();
    await elem.sendKeys(value);
  } while (await elem.getAttribute('value') !== value && attempts > 0);
}

export async function tickCheckbox(elem: ElementFinder) {
  await browser.wait(until.elementToBeClickable(elem));
  await elem.click();
}

export async function logIn() {
  await fillInput(loginNameInput, process.env.BRIDGE_AUTH_USERNAME);
  await fillInput(loginPasswordInput, process.env.BRIDGE_AUTH_PASSWORD);
  await browser.wait(until.elementToBeClickable(loginSubmitButton))
    .then(() => loginSubmitButton.click());
  await browser.wait(until.visibilityOf($('img.pf-c-brand')), PAGE_LOAD_TIMEOUT);
}

/**
   * Search YAML manifest for a given string. Return true if found.
   * @param     {string}    needle    String to search in YAML.
   * @param     {string}    name      Name of the resource.
   * @param     {string}    namespace Namespace of the resource.
   * @param     {string}    kind      Kind of the resource.
   * @returns   {boolean}             True if found, false otherwise.
   */
export function searchYAML(needle: string, name: string, namespace: string, kind: string): boolean {
  const result = execSync(`oc get -o yaml -n ${namespace} ${kind} ${name}`).toString();
  return result.search(needle) >= 0;
}

export function getResourceJSON(name: string, namespace: string, kind: string) {
  return execSync(`oc get -o json -n ${namespace} ${kind} ${name}`).toString();
}

/**
   * Search JSON manifest for a given property and value. Return true if found.
   * @param     {string}    propertyPath    String representing path to object property.
   * @param     {string}    value           String representing expected value of searched property.
   * @param     {string}    name            Name of the resource.
   * @param     {string}    namespace       Namespace of the resource.
   * @param     {string}    kind            Kind of the resource.
   * @returns   {boolean}                   True if found, false otherwise.
   */
export function searchJSON(propertyPath: string, value: string, name: string, namespace: string, kind: string): boolean {
  const resource = JSON.parse(getResourceJSON(name, namespace, kind));
  const result = _.get(resource, propertyPath, undefined);
  return result === value;
}


export const waitForCount = (elementArrayFinder, targetCount) => {
  return async() => {
    const count = await elementArrayFinder.count();
    return count === targetCount;
  };
};

