/* eslint-disable no-await-in-loop */
import { execSync } from 'child_process';
import * as _ from 'lodash';
import { $, $$, browser, by, ExpectedConditions as until } from 'protractor';
import { testName, appHost } from '@console/internal-integration-tests/protractor.conf';
import {
  isLoaded,
  createYAMLButton,
  rowForName,
  createItemButton,
  createYAMLLink,
  resourceTitle,
} from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import {
  isLoaded as yamlPageIsLoaded,
  saveButton,
} from '@console/internal-integration-tests/views/yaml.view';
import { STORAGE_CLASS, PAGE_LOAD_TIMEOUT_SECS, SEC } from './consts';
import { NodePortService } from './types';

export async function fillInput(elem: any, value: string) {
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

export async function setCheckboxState(elem: any, targetState: boolean) {
  const checkboxState = await elem.isSelected();
  if (checkboxState !== targetState) {
    await click(elem);
  }
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

export async function createExampleVMViaYAML() {
  await browser.get(`${appHost}/k8s/ns/${testName}/virtualmachines`);
  await isLoaded();
  await click(createItemButton);
  await click(createYAMLLink);
  await yamlPageIsLoaded();
  await click(saveButton);
  await browser.wait(until.presenceOf(resourceTitle));
}

export async function getInputValue(elem: any) {
  return elem.getAttribute('value');
}

export async function getSelectedOptionText(selector: any) {
  return selector.$('option:checked').getText();
}

export async function selectOptionByText(selector: any, option: string) {
  await click(selector.all(by.cssContainingText('option', option)).first());
}

export async function selectOptionByOptionValue(selector: any, option: string) {
  await click(selector.all(by.css(`option[value="${option}"]`)).first());
}

export async function getSelectOptions(selector: any): Promise<string[]> {
  const options = [];
  await selector.$$('option').each((elem) => {
    elem
      .getText()
      .then((text) => options.push(text))
      .catch((err) => Promise.reject(err));
  });
  if (options.length > 0) {
    if (options[0].startsWith('---') || options[0].startsWith('Please select')) {
      return options.slice(1);
    }
  }
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

export const waitFor = async (element, text, count = 1) => {
  let rowNumber = 0;
  while (rowNumber !== count) {
    await browser.wait(until.visibilityOf(element));
    const elemText = await element.getText();
    if (elemText.includes(text)) {
      rowNumber += 1;
    } else {
      rowNumber = 0;
    }
    /* eslint-disable no-await-in-loop */
    await browser.sleep(5 * SEC);
  }
};

export function pauseVM(name: string, namespace: string): void {
  execSync(`virtctl pause vmi ${name} -n ${namespace}`);
}
