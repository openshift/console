/* eslint-disable no-await-in-loop */
import { execSync } from 'child_process';
import { ElementFinder, browser, ExpectedConditions as until } from 'protractor';
import { NodePortService } from './types';

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
  } while ((await elem.getAttribute('value')) !== value && attempts > 0);
}

export async function getInputValue(elem: ElementFinder) {
  return elem.getAttribute('value');
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
