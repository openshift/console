/* eslint-disable no-unused-vars, no-undef */
import * as _ from 'lodash';
import { execSync } from 'child_process';
import { $, by, ElementFinder, browser, ExpectedConditions as until } from 'protractor';

import { config } from '../../../protractor.conf';
import { nameInput as loginNameInput, passwordInput as loginPasswordInput, submitButton as loginSubmitButton } from '../../../views/login.view';
import { PAGE_LOAD_TIMEOUT } from './consts';


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

export function addLeakableResource(leakedResources: Set<string>, resource) {
  leakedResources.add(
    JSON.stringify({name: resource.metadata.name, namespace: resource.metadata.namespace, kind: resource.kind})
  );
}

export function removeLeakableResource(leakedResources: Set<string>, resource) {
  leakedResources.delete(
    JSON.stringify({name: resource.metadata.name, namespace: resource.metadata.namespace, kind: resource.kind})
  );
}

export function createResource(resource) {
  execSync(`echo '${JSON.stringify(resource)}' | kubectl create -f -`);
}

export function createResources(resources) {
  resources.forEach(createResource);
}

export function deleteResource(resource) {
  const kind = resource.kind === 'NetworkAttachmentDefinition' ? 'net-attach-def' : resource.kind;
  execSync(`kubectl delete -n ${resource.metadata.namespace} --cascade ${kind} ${resource.metadata.name}`);
}

export function deleteResources(resources) {
  resources.forEach(deleteResource);
}

export async function withResource(resourceSet: Set<string>, resource: any, callback: Function, keepResource: boolean = false) {
  addLeakableResource(resourceSet, resource);
  await callback();
  if (!keepResource) {
    deleteResource(resource);
    removeLeakableResource(resourceSet, resource);
  }
}

export async function click(elem: ElementFinder, timeout?: number, conditionFunc?: Function) {
  const _timeout = timeout !== undefined ? timeout : config.jasmineNodeOpts.defaultTimeoutInterval;
  if (conditionFunc === undefined) {
    await browser.wait(until.elementToBeClickable(elem), _timeout);
    await elem.click();
  } else {
    do {
      await browser.wait(until.elementToBeClickable(elem), _timeout);
      await elem.click();
    } while (await conditionFunc() === false);
  }
}

export async function selectDropdownOption(dropdownId: string, option: string) {
  await click($(dropdownId));
  await $(`${dropdownId} + ul`).element(by.linkText(option)).click();
}

export async function getDropdownOptions(dropdownId: string): Promise<string[]> {
  const options = [];
  await $(`${dropdownId} + ul`).$$('li').each(async(element) => {
    element.getText().then((text) => {
      options.push(text);
    });
  });
  return options;
}

export async function fillInput(elem: ElementFinder, value: string) {
  // Sometimes there seems to be an issue with clear() method not clearing the input
  let attempts = 3;
  do {
    --attempts;
    if (attempts < 0) {
      throw Error(`Failed to fill input with value: '${value}'.`);
    }
    await browser.wait(until.elementToBeClickable(elem));
    // TODO: line below can be removed when pf4 tables in use.
    await elem.click();
    await elem.clear();
    await elem.sendKeys(value);
  } while (await elem.getAttribute('value') !== value && attempts > 0);
}

export async function getInputValue(elem: ElementFinder) {
  return elem.getAttribute('value');
}

export async function logIn() {
  await fillInput(loginNameInput, process.env.BRIDGE_AUTH_USERNAME);
  await fillInput(loginPasswordInput, process.env.BRIDGE_AUTH_PASSWORD);
  await click(loginSubmitButton);
  await browser.wait(until.visibilityOf($('img.pf-c-brand')), PAGE_LOAD_TIMEOUT);
}

export function getRandStr(length: number) {
  return Math.random().toString(36).replace(/[.]/g, '').substr(1, length); // First char is always 0
}

export function getRandomMacAddress() {
  const getRandByte = () => {
    let byte: string;
    do {
      byte = Math.random().toString(16).substr(2, 2);
    }
    while (byte.length !== 2);
    return byte;
  };
  return `30:24:${getRandByte()}:${getRandByte()}:${getRandByte()}:${getRandByte()}`;
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

export function getResourceObject(name: string, namespace: string, kind: string) {
  const resourceJson = execSync(`oc get -o json -n ${namespace} ${kind} ${name}`).toString();
  return JSON.parse(resourceJson);
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
  const resource = getResourceObject(name, namespace, kind);
  const result = _.get(resource, propertyPath, undefined);
  return result === value;
}

export const waitForCount = (elementArrayFinder, targetCount) => {
  return async() => {
    const count = await elementArrayFinder.count();
    return count === targetCount;
  };
};

export function execCommandFromCli(command: string) {
  try {
    execSync(command);
  } catch (error) {
    console.error(`Failed to run ${command}:\n${error}`);
    throw Error(`Failed to run ${command}:\n${error}`);
  }
}

export function exposeService(exposeServices: Set<any>) {
  const srvArray: Array<any> = [...exposeServices];
  srvArray.forEach(({name, kind, port, targetPort, exposeName, type, namespace}) => {
    execCommandFromCli(`virtctl expose ${kind} ${name} --port=${port} --target-port=${targetPort} --name=${exposeName} --type=${type} -n ${namespace}`);
  });
}

export async function asyncForEach(iterable, callback) {
  const array = [...iterable];
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export const waitForStringInElement = (element: ElementFinder, needle: string) => {
  return async() => {
    const content = await element.getText();
    return content.includes(needle);
  };
};

// eslint-disable-next-line eqeqeq
export const resolveTimeout = (timeout, defaultTimeout) => timeout != undefined ? timeout : defaultTimeout;

export const waitForStringNotInElement = (element: ElementFinder, needle: string) => {
  return async() => {
    const content = await element.getText();
    return !content.includes(needle);
  };
};
