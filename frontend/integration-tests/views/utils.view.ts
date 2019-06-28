import { $, browser, by, ExpectedConditions as until, element } from 'protractor';
import { execSync } from 'child_process';
import * as _ from 'lodash';

export const chooseFromList = async(itemName: string) => {
  await browser.wait(until.presenceOf($('li')), 5000);
  await element(by.cssContainingText('li span', itemName)).click();
};

export const getKeyIndex = async function(iterable, needle, callback) {
  const array = [...iterable];
  for (let index = 0; index < array.length; index++) {
    if (await callback(array[index], index, array)) {
      return index;
    }
  }
};

export const getResourceJSON = (name: string, namespace: string, kind: string) => {
  return execSync(`kubectl get -o json -n ${namespace} ${kind} ${name}`).toString();
};

export const isValueInJSONPath = (propertyPath: string, value: string, name: string, namespace: string, kind: string): boolean => {
  const resource = JSON.parse(getResourceJSON(name, namespace, kind));
  const result = _.get(resource, propertyPath, undefined);
  return result === value;
};
