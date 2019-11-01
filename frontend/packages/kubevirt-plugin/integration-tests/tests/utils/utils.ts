/* eslint-disable no-await-in-loop */
import { execSync } from 'child_process';
import * as _ from 'lodash';
import { $, $$, ElementFinder, browser, by, ExpectedConditions as until } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import {
  isLoaded,
  createYAMLButton,
  rowForName,
} from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { STORAGE_CLASS, PAGE_LOAD_TIMEOUT_SECS } from './consts';
import { NodePortService } from './types';

export async function fillInput(elem: ElementFinder, value: string) {
  // Sometimes there seems to be an issue with clear() method not clearing the input
  let attempts = 3;
  do {
    --attempts;
    if (attempts < 0) {
      throw Error(`Failed to fill input with value: '${value}'.`);
    }
    await browser.wait(until.and(until.presenceOf(elem), until.elementToBeClickable(elem)));
    // TODO: line below can be removed when pf4 tables in use.
    await elem.click();
    await elem.clear();
    await elem.sendKeys(value);
  } while ((await elem.getAttribute('value')) !== value && attempts > 0);
}

export async function createProject(name: string) {
  // Use projects if OpenShift so non-admin users can run tests.
  const resource = browser.params.openshift === 'true' ? 'projects' : 'namespaces';
  await browser.get(`${appHost}/k8s/cluster/${resource}`);
  await isLoaded();
  const exists = await rowForName(name).isPresent();
  if (!exists) {
    await createYAMLButton.click();
    await browser.wait(until.presenceOf($('.modal-body__field')));
    await $$('.modal-body__field')
      .get(0)
      .$('input')
      .sendKeys(name);
    await $$('.modal-body__field')
      .get(1)
      .$('input')
      .sendKeys(`test-name=${name}`);
    await $('.modal-content')
      .$('#confirm-action')
      .click();
    await browser.wait(until.urlContains(`/${name}`), PAGE_LOAD_TIMEOUT_SECS);
  }
}

export async function getInputValue(elem: ElementFinder) {
  return elem.getAttribute('value');
}

export async function getSelectedOptionText(selector: ElementFinder) {
  return selector.$('option:checked').getText();
}

export async function selectOptionByText(selector: ElementFinder, option: string) {
  await click(selector.all(by.cssContainingText('option', option)).first());
}

export async function selectOptionByOptionValue(selector: ElementFinder, option: string) {
  await click(selector.all(by.css(`option[value="${option}"]`)).first());
}

export async function getSelectOptions(selector: ElementFinder): Promise<string[]> {
  const options = [];
  await selector.$$('option').each((elem) => {
    elem
      .getText()
      .then((text) => options.push(text))
      .catch((err) => Promise.reject(err));
  });
  return options;
}

export function getRandStr(length: number) {
  return Math.random()
    .toString(36)
    .replace(/[.]/g, '')
    .substr(1, length); // First char is always 0
}

export function getRandomMacAddress() {
  const getRandByte = () => {
    let byte: string;
    do {
      byte = Math.random()
        .toString(16)
        .substr(2, 2);
    } while (byte.length !== 2);
    return byte;
  };
  return `30:24:${getRandByte()}:${getRandByte()}:${getRandByte()}:${getRandByte()}`;
}

export function getResourceObject(name: string, namespace: string, kind: string) {
  const resourceJson = execSync(`kubectl get -o json -n ${namespace} ${kind} ${name}`).toString();
  return JSON.parse(resourceJson);
}

export function exposeServices(services: Set<any>) {
  const servicesArray: NodePortService[] = [...services];
  servicesArray.forEach(({ name, kind, port, targetPort, exposeName, type, namespace }) => {
    execSync(
      `virtctl expose ${kind} ${name} --port=${port} --target-port=${targetPort} --name=${exposeName} --type=${type} -n ${namespace}`,
    );
  });
}

export function resolveStorageDataAttribute(configMap: any, attribute: string): string {
  const storageClassAttributePath = ['data', `${STORAGE_CLASS}.${attribute}`];
  if (_.has(configMap, storageClassAttributePath)) {
    return _.get(configMap, storageClassAttributePath);
  }
  return _.get(configMap, ['data', attribute]);
}
